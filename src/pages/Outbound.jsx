import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import * as db from '../db'
import { List, SearchBar, Toast, Form, Stepper, Card, TextArea, Button } from 'antd-mobile'

export default function Outbound({ onDone }) {
  const { team, user } = useAuth()
  const [products, setProducts] = useState([])
  const [searchText, setSearchText] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [remark, setRemark] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadProducts = useCallback(async () => {
    if (team) {
      const data = await db.getProducts(team.id)
      setProducts(data || [])
    }
  }, [team])

  useEffect(() => { loadProducts() }, [loadProducts])

  function selectProduct(product) {
    if (product.current_stock <= 0) {
      Toast.show('该货物库存为0，无法出库')
      return
    }
    setSelectedProduct(product)
    setQuantity(1)
    setRemark('')
  }

  async function handleSubmit() {
    if (!selectedProduct) { Toast.show('请选择货物'); return }
    if (quantity <= 0) { Toast.show('数量必须大于0'); return }
    if (quantity > selectedProduct.current_stock) {
      Toast.show(`库存不足！当前库存: ${selectedProduct.current_stock} ${selectedProduct.unit}`)
      return
    }

    setSubmitting(true)
    const newStock = selectedProduct.current_stock - quantity

    try {
      // 写入出库记录
      await db.addStockOut({
        product_id: selectedProduct.id,
        team_id: team.id,
        product_name: selectedProduct.name,
        quantity,
        operator: user.id,
        operator_name: user.name,
        remark: remark || '',
      })

      // 更新库存
      await db.updateProductStock(selectedProduct.id, newStock)

      Toast.show(`✅ 出库成功：${selectedProduct.name} -${quantity} ${selectedProduct.unit}`)
      setSelectedProduct(null)
      if (onDone) onDone()
    } catch (e) {
      Toast.show('出库失败: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <div style={{ padding: '0 12px' }}>
      <h2 style={{ padding: '12px 4px 4px', fontSize: 18 }}>📤 出库</h2>

      {!selectedProduct ? (
        <>
          <SearchBar placeholder="搜索要出库的货物" value={searchText} onChange={setSearchText} />
          <List style={{ marginTop: 8, borderRadius: 12, overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <List.Item description="请先在库存页面添加货物">未找到货物</List.Item>
            ) : filtered.map(p => (
              <List.Item
                key={p.id}
                clickable
                title={`${p.name} ${p.spec || ''}`}
                description={
                  <span style={{ color: p.current_stock <= 0 ? '#ff3141' : '#999' }}>
                    当前库存: {p.current_stock} {p.unit}
                    {p.current_stock <= 0 && ' (缺货)'}
                  </span>
                }
                onClick={() => selectProduct(p)}
              />
            ))}
          </List>
        </>
      ) : (
        <Card style={{ marginTop: 8, borderRadius: 12 }}>
          <div style={{ padding: '8px 0' }}>
            <h3 style={{ margin: '0 0 16px' }}>出库 - {selectedProduct.name} {selectedProduct.spec}</h3>
            <p style={{ color: '#999', margin: '4px 0' }}>
              当前库存: <span style={{ color: selectedProduct.current_stock <= quantity ? '#ff3141' : '#1677ff', fontWeight: 600 }}>
                {selectedProduct.current_stock}
              </span> {selectedProduct.unit}
              {selectedProduct.current_stock <= quantity && <span style={{ color: '#ff3141', marginLeft: 8, fontSize: 12 }}>⚠库存不足</span>}
            </p>

            <Form layout="horizontal" style={{ marginTop: 12 }}>
              <Form.Item label="出库数量">
                <Stepper min={1} max={selectedProduct.current_stock} value={quantity} onChange={setQuantity} />
              </Form.Item>
              <Form.Item label="备注">
                <TextArea placeholder="可选备注，如出库原因" rows={2} value={remark} onChange={setRemark} />
              </Form.Item>
            </Form>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <Button block onClick={() => setSelectedProduct(null)}>返回选择</Button>
              <Button block color="danger" loading={submitting} onClick={handleSubmit}>确认出库</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
