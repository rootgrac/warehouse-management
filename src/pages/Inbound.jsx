import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'
import { List, SearchBar, Toast, Form, Input, Stepper, Card, TextArea, Button } from 'antd-mobile'

export default function Inbound({ onDone }) {
  const { team, user } = useAuth()
  const [products, setProducts] = useState([])
  const [searchText, setSearchText] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState('')
  const [remark, setRemark] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (team) loadProducts()
  }, [team])

  async function loadProducts() {
    const { data } = await supabase.from('products').select('*').eq('team_id', team.id).order('name')
    setProducts(data || [])
  }

  function selectProduct(product) {
    setSelectedProduct(product)
    setUnitPrice(String(product.unit_price || ''))
    setQuantity(1)
    setRemark('')
  }

  async function handleSubmit() {
    if (!selectedProduct) { Toast.show('请选择货物'); return }
    if (quantity <= 0) { Toast.show('数量必须大于0'); return }

    setSubmitting(true)
    const price = parseFloat(unitPrice) || 0
    const total = price * quantity

    // 1. 写入入库记录
    const { error: recordError } = await supabase.from('stock_in_records').insert({
      product_id: selectedProduct.id,
      team_id: team.id,
      quantity,
      unit_price: price,
      total_amount: total,
      operator: user.id,
      remark: remark || '',
    })
    if (recordError) { Toast.show('入库失败: ' + recordError.message); setSubmitting(false); return }

    // 2. 更新库存
    const { error: updateError } = await supabase
      .from('products')
      .update({ current_stock: selectedProduct.current_stock + quantity, unit_price: price })
      .eq('id', selectedProduct.id)
    if (updateError) { Toast.show('库存更新失败: ' + updateError.message); setSubmitting(false); return }

    Toast.show(`✅ 入库成功：${selectedProduct.name} +${quantity} ${selectedProduct.unit}`)
    setSelectedProduct(null)
    setSubmitting(false)
    if (onDone) onDone()
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <div style={{ padding: '0 12px' }}>
      <h2 style={{ padding: '12px 4px 4px', fontSize: 18 }}>📥 入库</h2>

      {!selectedProduct ? (
        <>
          <SearchBar placeholder="搜索要入库的货物" value={searchText} onChange={setSearchText} />
          <List style={{ marginTop: 8, borderRadius: 12, overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <List.Item description="请先在库存页面添加货物">未找到货物</List.Item>
            ) : filtered.map(p => (
              <List.Item
                key={p.id}
                clickable
                title={`${p.name} ${p.spec || ''}`}
                description={`当前库存: ${p.current_stock} ${p.unit}`}
                onClick={() => selectProduct(p)}
              />
            ))}
          </List>
        </>
      ) : (
        <Card style={{ marginTop: 8, borderRadius: 12 }}>
          <div style={{ padding: '8px 0' }}>
            <h3 style={{ margin: '0 0 16px' }}>入库 - {selectedProduct.name} {selectedProduct.spec}</h3>
            <p style={{ color: '#999', margin: '4px 0' }}>当前库存: {selectedProduct.current_stock} {selectedProduct.unit}</p>

            <Form layout="horizontal" style={{ marginTop: 12 }}>
              <Form.Item label="入库数量">
                <Stepper min={1} max={99999} value={quantity} onChange={setQuantity} />
              </Form.Item>
              <Form.Item label="进货单价(元)">
                <Input placeholder="单价" type="number" value={unitPrice} onChange={setUnitPrice} />
              </Form.Item>
              <Form.Item label="总金额">
                <span style={{ color: '#1677ff', fontWeight: 600 }}>
                  ¥{((parseFloat(unitPrice) || 0) * quantity).toFixed(2)}
                </span>
              </Form.Item>
              <Form.Item label="备注">
                <TextArea placeholder="可选备注" rows={2} value={remark} onChange={setRemark} />
              </Form.Item>
            </Form>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <Button block onClick={() => setSelectedProduct(null)}>返回选择</Button>
              <Button block color="primary" loading={submitting} onClick={handleSubmit}>确认入库</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
