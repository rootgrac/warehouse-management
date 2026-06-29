import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Form, Input, Button, Toast, Tabs, Card } from 'antd-mobile'

export default function Login({ showTeamSetup }) {
  const { login, createTeamAndLogin } = useAuth()
  const [activeTab, setActiveTab] = useState(showTeamSetup ? 'create' : 'join')
  const [name, setName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleCreateTeam() {
    if (!name.trim()) { Toast.show('请输入你的姓名'); return }
    if (!teamName.trim()) { Toast.show('请输入团队名称'); return }
    setSubmitting(true)
    try {
      const team = await createTeamAndLogin(name.trim(), teamName.trim())
      Toast.show(`团队创建成功！邀请码：${team.invite_code}`)
    } catch (e) {
      Toast.show(e.message || '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleJoinTeam() {
    if (!name.trim()) { Toast.show('请输入你的姓名'); return }
    if (!inviteCode.trim()) { Toast.show('请输入邀请码'); return }
    setSubmitting(true)
    try {
      const team = await login(name.trim(), inviteCode.trim().toUpperCase())
      Toast.show(`成功加入"${team.name}"`)
    } catch (e) {
      Toast.show(e.message || '加入失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🏗️ 仓库管理</h1>
        <p style={styles.sub}>多人共享 · 实时同步</p>
      </div>
      <Card style={styles.card}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ '--title-font-size': '15px' }}>
          <Tabs.Tab title="加入团队" key="join">
            <Form layout="horizontal" style={{ marginTop: 16 }}>
              <Form.Item label="姓名">
                <Input placeholder="你的名字" value={name} onChange={setName} />
              </Form.Item>
              <Form.Item label="邀请码">
                <Input placeholder="输入6位邀请码" value={inviteCode} onChange={v => setInviteCode(v.toUpperCase())} maxLength={6} />
              </Form.Item>
            </Form>
            <Button block color="primary" loading={submitting} onClick={handleJoinTeam} style={{ marginTop: 12 }}>
              加入团队
            </Button>
          </Tabs.Tab>
          <Tabs.Tab title="创建团队" key="create">
            <Form layout="horizontal" style={{ marginTop: 16 }}>
              <Form.Item label="姓名">
                <Input placeholder="你的名字" value={name} onChange={setName} />
              </Form.Item>
              <Form.Item label="团队名称">
                <Input placeholder="例如：1号仓库" value={teamName} onChange={setTeamName} />
              </Form.Item>
            </Form>
            <Button block color="primary" loading={submitting} onClick={handleCreateTeam} style={{ marginTop: 12 }}>
              创建团队
            </Button>
          </Tabs.Tab>
        </Tabs>
      </Card>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)', padding: '40px 20px' },
  header: { textAlign: 'center', marginBottom: 24, color: '#fff' },
  title: { fontSize: 28, margin: 0, fontWeight: 700 },
  sub: { fontSize: 14, opacity: 0.85, marginTop: 8 },
  card: { borderRadius: 12, overflow: 'hidden' },
}
