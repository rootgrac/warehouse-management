import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as db from '../db'
import { List, NavBar, Tabs, SpinLoading, Empty } from 'antd-mobile'

export default function Records() {
  const { team } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const loadRecords = useCallback(async () => {
    if (!team) return
    setLoading(true)

    let inRecords = []
    let outRecords = []

    try {
      if (activeTab === 'all' || activeTab === 'in') {
        inRecords = (await db.getStockInRecords(team.id)).map(r => ({ ...r, type: 'in' }))
      }
      if (activeTab === 'all' || activeTab === 'out') {
        outRecords = (await db.getStockOutRecords(team.id)).map(r => ({ ...r, type: 'out' }))
      }
    } catch (e) {
      console.error('加载记录失败', e)
    }

    const all = [...inRecords, ...outRecords].sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    )
    setRecords(all.slice(0, 200))
    setLoading(false)
  }, [team, activeTab])

  useEffect(() => { loadRecords() }, [loadRecords])

  function formatTime(ts) {
    const d = new Date(ts)
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
      <NavBar onBack={() => navigate('/')} style={{ background: '#fff' }}>出入库流水记录</NavBar>

      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ background: '#fff' }}>
        <Tabs.Tab title="全部" key="all" />
        <Tabs.Tab title="入库记录" key="in" />
        <Tabs.Tab title="出库记录" key="out" />
      </Tabs>

      <div style={{ padding: '0 12px', marginTop: 8 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><SpinLoading color="primary" /></div>
        ) : records.length === 0 ? (
          <Empty description="暂无记录" style={{ marginTop: 40 }} />
        ) : (
          <List style={{ borderRadius: 12, overflow: 'hidden' }}>
            {records.map(r => (
              <List.Item
                key={`${r.type}-${r.id}`}
                prefix={
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 36, height: 36, borderRadius: '50%',
                    background: r.type === 'in' ? '#e6f4ff' : '#fff1f0',
                    color: r.type === 'in' ? '#1677ff' : '#ff4d4f',
                    fontSize: 18, marginRight: 12,
                  }}>
                    {r.type === 'in' ? '📥' : '📤'}
                  </span>
                }
                title={
                  <span>
                    {r.product_name || r.product_id}
                    <span style={{ color: r.type === 'in' ? '#1677ff' : '#ff4d4f', marginLeft: 8, fontWeight: 600 }}>
                      {r.type === 'in' ? '+' : '-'}{r.quantity}
                    </span>
                  </span>
                }
                description={
                  <span style={{ fontSize: 12, color: '#999' }}>
                    {formatTime(r.created_at)}
                    {r.operator_name && ` · ${r.operator_name}`}
                    {r.type === 'in' && r.unit_price > 0 && ` · 合计¥${r.total_amount}`}
                    {r.remark && ` · ${r.remark}`}
                  </span>
                }
              />
            ))}
          </List>
        )}
      </div>
    </div>
  )
}
