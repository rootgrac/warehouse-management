import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import * as db from '../db'
import { List, SearchBar, Tag, Dialog, Toast, Form, Input, Stepper, FloatingBubble } from 'antd-mobile'
import { AddOutline } from 'antd-mobile-icons'

export default function Stock() {
  const { team, user } = useAuth()
  const [products, setProducts] = useState([])
  const [searchText, setSearchText] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)

  // 新货物表单
  const [newProduct, setNewProduct] = useState({ name: '', spec: '', unit: '个', unit_price: '', low_stock_threshold: '10' })

  const loadProducts = useCallback(async () => {
    if (!team) return
    try {
      const data = await db.getProducts(team.id)
      setProducts(data || [])
    } catch (e) { console.error('加载货物失败', e) }
    setLoading(false)
  }, [team])

  useEffect(() => { loadProducts() }, [loadProducts])

  // 轮询同步：每5秒刷新一次
  useEffect(() => {
    if (!team) return
    const interval = setInterval(loadProducts, 5000)
    return () => clearInterval(interval)
  }, [loadProducts])

  async function handleAdd() {
    if (!newProduct.name.trim()) { Toast.show('请输入货物名称'); return }
    try {
      await db.addProduct({
        team_id: team.id,
        name: newProduct.name.trim(),
        spec: newProduct.spec.trim(),
        unit: newProduct.unit || '个',
        unit_price: parseFloat(newProduct.unit_price) || 0,
        low_stock_threshold: parseInt(newProduct.low_stock_threshold) || 10,
      })
      Toast.show('货物添加成功')
      setNewProduct({ name: '', spec: '', unit: '个', unit_price: '', low_stock_threshold: '10' })
      setShowAdd(false)
      loadProducts()
    } catch (e) {
      Toast.show('添加失败: ' + e.message)
    }
  }

  async function handleDelete(product) {
    const ok = await Dialog.confirm({ content: `确定删除"${product.name}"吗？`, confirmText: '删除' })
    if (!ok) return
    try {
      await db.deleteProduct(product.id)
      Toast.show('已删除')
      loadProducts()
    } catch (e) {
      Toast.show('删除失败: ' + e.message)
    }
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
