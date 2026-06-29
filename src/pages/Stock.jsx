import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'
import { List, SearchBar, Tag, Dialog, Toast, Form, Input, Stepper, FloatingBubble } from 'antd-mobile'
import { AddOutline } from 'antd-mobile-icons'

export default function Stock() {
  const { team } = useAuth()
  const [products, setProducts] = useState([])
  const [searchText, setSearchText] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)

  // 新货物表单
  const [newProduct, setNewProduct] = useState({ name: '', spec: '', unit: '个', unit_price: '', low_stock_threshold: '10' })

  useEffect(() => {
    if (!team) return
    loadProducts()

    // 实时订阅：监听货物变更
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products', filter: `team_id=eq.${team.id}` },
        () => { loadProducts() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [team])

  async function loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('team_id', team.id)
      .order('name')
    setProducts(data || [])
    setLoading(false)
  }

  async function handleAdd() {
    if (!newProduct.name) { Toast.show('请输入货物名称'); return }
    const { error } = await supabase.from('products').insert({
      team_id: team.id,
      name: newProduct.name,
      spec: newProduct.spec || '',
      unit: newProduct.unit || '个',
      current_stock: 0,
      unit_price: parseFloat(newProduct.unit_price) || 0,
      low_stock_threshold: parseInt(newProduct.low_stock_threshold) || 10,
    })
    if (error) { Toast.show('添加失败: ' + error.message); return }

    Toast.show('货物添加成功')
    setNewProduct({ name: '', spec: '', unit: '个', unit_price: '', low_stock_threshold: '10' })
    setShowAdd(false)
  }

  async function handleDelete(product) {
    const ok = await Dialog.confirm({ content: `确定删除"${product.name}"吗？`, confirmText: '删除' })
    if (!ok) return
    await supabase.from('products').delete().eq('id', product.id)
    Toast.show('已删除')
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (p.spec && p.spec.toLowerCase().includes(searchText.toLowerCase()))
  )

  if (loading) return <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>加载中...</div>

  return (
    <div style={{ padding: '0 12px' }}>
      <h2 style={{ padding: '12px 4px 4px', fontSize: 18 }}>📦 库存总览</h2>
      <SearchBar placeholder="搜索货物名称或规格" value={searchText} onChange={setSearchText} />

      <List style={{ marginTop: 8, borderRadius: 12, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <List.Item description="点击右下角 + 添加货物">暂无货物</List.Item>
        ) : filtered.map(p => {
          const isLow = p.current_stock <= p.low_stock_threshold
          return (
            <List.Item
              key={p.id}
              title={<span>{p.name} {p.spec && <span style={{ color: '#999', fontSize: 13 }}>{p.spec}</span>}</span>}
              description={
                <span>
                  <Tag color={isLow ? 'danger' : 'success'} fill="outline" style={{ marginRight: 8 }}>
                    库存: {p.current_stock} {p.unit}
                  </Tag>
                  <span style={{ color: '#999' }}>单价: ¥{p.unit_price}/{p.unit}</span>
                  {isLow && <span style={{ color: '#ff3141', marginLeft: 8, fontSize: 12 }}>⚠库存不足</span>}
                </span>
              }
              extra={
                <span style={{ color: '#1677ff', fontWeight: 600 }}>
                  ¥{(p.current_stock * p.unit_price).toFixed(0)}
                </span>
              }
              onLongPress={() => handleDelete(p)}
            />
          )
        })}
      </List>

      <div style={{ height: 80 }} />

      <FloatingBubble
        style={{ '--initial-position-bottom': '80px', '--initial-position-right': '24px' }}
        onClick={() => setShowAdd(true)}
      >
        <AddOutline fontSize={24} />
      </FloatingBubble>

      {/* 添加货物弹窗 */}
      <Dialog
        visible={showAdd}
        title="添加货物"
        content={
          <Form layout="horizontal">
            <Form.Item label="名称" required><Input placeholder="货物名称" value={newProduct.name} onChange={v => setNewProduct(p => ({ ...p, name: v }))} /></Form.Item>
            <Form.Item label="规格"><Input placeholder="型号/规格" value={newProduct.spec} onChange={v => setNewProduct(p => ({ ...p, spec: v }))} /></Form.Item>
            <Form.Item label="单位"><Input placeholder="个/箱/kg" value={newProduct.unit} onChange={v => setNewProduct(p => ({ ...p, unit: v }))} /></Form.Item>
            <Form.Item label="单价(元)"><Input placeholder="0.00" type="number" value={newProduct.unit_price} onChange={v => setNewProduct(p => ({ ...p, unit_price: v }))} /></Form.Item>
            <Form.Item label="低库存阈值"><Stepper min={0} max={9999} value={parseInt(newProduct.low_stock_threshold) || 0} onChange={v => setNewProduct(p => ({ ...p, low_stock_threshold: String(v) }))} /></Form.Item>
          </Form>
        }
        actions={[
          { key: 'cancel', text: '取消', onClick: () => setShowAdd(false) },
          { key: 'confirm', text: '添加', onClick: handleAdd },
        ]}
        onClose={() => setShowAdd(false)}
      />
    </div>
  )
}
