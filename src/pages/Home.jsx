import { useState } from 'react'
import { TabBar } from 'antd-mobile'
import { AppOutline, UnorderedListOutline, AddCircleOutline, UserOutline } from 'antd-mobile-icons'
import Stock from './Stock'
import Inbound from './Inbound'
import Outbound from './Outbound'
import Profile from './Profile'

const tabs = [
  { key: 'stock', title: '库存', icon: <AppOutline /> },
  { key: 'inbound', title: '入库', icon: <AddCircleOutline /> },
  { key: 'outbound', title: '出库', icon: <UnorderedListOutline /> },
  { key: 'profile', title: '我的', icon: <UserOutline /> },
]

export default function Home() {
  const [activeKey, setActiveKey] = useState('stock')

  const pageContent = {
    stock: <Stock />,
    inbound: <Inbound onDone={() => setActiveKey('stock')} />,
    outbound: <Outbound onDone={() => setActiveKey('stock')} />,
    profile: <Profile />,
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 8 }}>
        {pageContent[activeKey]}
      </div>
      <TabBar activeKey={activeKey} onChange={setActiveKey} safeArea>
        {tabs.map(tab => (
          <TabBar.Item key={tab.key} icon={tab.icon} title={tab.title} />
        ))}
      </TabBar>
    </div>
  )
}
