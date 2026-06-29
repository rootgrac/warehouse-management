import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Form, Input, Button, Toast, Tabs, Card } from 'antd-mobile'

export default function Login({ showTeamSetup }) {
  const { signUp, signIn, createTeam, joinTeam, loading } = useAuth()
  const [activeTab, setActiveTab] = useState(showTeamSetup ? 'team' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleLogin() {
    if (!email || !password) { Toast.show('请填写邮箱和密码'); return }
    setSubmitting(true)
    try {
      await signIn(email, password)
      Toast.show('登录成功')
    } catch (e) {
      Toast.show(e.message || '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRegister() {
    if (!email || !password || !name) { Toast.show('请填写所有字段'); return }
    setSubmitting(true)
    try {
      await signUp(email, password, name)
      Toast.show('注册成功，请查看邮箱确认（或已自动登录）')
    } catch (e) {
      Toast.show(e.message || '注册失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateTeam() {
    if (!teamName) { Toast.show('请输入团队名称'); return }
    setSubmitting(true)
    try {
      const team = await createTeam(teamName)
      Toast.show(`团队"${team.name}"创建成功！邀请码：${team.invite_code}`)
    } catch (e) {
      Toast.show(e.message || '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleJoinTeam() {
    if (!inviteCode) { Toast.show('请输入邀请码'); return }
    setSubmitting(true)
    try {
      const team = await joinTeam(inviteCode)
      Toast.show(`成功加入"${team.name}"`)
    } catch (e) {
      Toast.show(e.message || '加入失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (showTeamSetup) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>🏗️ 仓库管理</h1>
          <p style={styles.sub}>设置你的仓库</p>
        </div>
        <Card style={styles.card}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ '--title-font-size': '15px' }}>
            <Tabs.Tab title="创建团队" key="create">
              <Form layout="horizontal" style={{ marginTop: 16 }}>
                <Form.Item label="团队名称">
                  <Input placeholder="例如：1号仓库" value={teamName} onChange={setTeamName} />
                </Form.Item>
              </Form>
              <Button block color="primary" loading={submitting} onClick={handleCreateTeam} style={{ marginTop: 12 }}>
                创建团队
              </Button>
            </Tabs.Tab>
            <Tabs.Tab title="加入团队" key="join">
              <Form layout="horizontal" style={{ marginTop: 16 }}>
                <Form.Item label="邀请码">
                  <Input placeholder="输入6位邀请码" value={inviteCode} onChange={v => setInviteCode(v.toUpperCase())} maxLength={6} />
                </Form.Item>
              </Form>
              <Button block color="primary" loading={submitting} onClick={handleJoinTeam} style={{ marginTop: 12 }}>
                加入团队
              </Button>
            </Tabs.Tab>
          </Tabs>
        </Card>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🏗️ 仓库管理</h1>
        <p style={styles.sub}>多人共享 · 实时同步</p>
      </div>
      <Card style={styles.card}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ '--title-font-size': '15px' }}>
          <Tabs.Tab title="登录" key="login">
            <Form layout="horizontal" style={{ marginTop: 16 }}>
              <Form.Item label="邮箱">
                <Input placeholder="请输入邮箱" value={email} onChange={setEmail} type="email" />
              </Form.Item>
              <Form.Item label="密码">
                <Input placeholder="请输入密码" value={password} onChange={setPassword} type="password" />
              </Form.Item>
            </Form>
            <Button block color="primary" loading={submitting} onClick={handleLogin} style={{ marginTop: 12 }}>
              登录
            </Button>
          </Tabs.Tab>
          <Tabs.Tab title="注册" key="register">
            <Form layout="horizontal" style={{ marginTop: 16 }}>
              <Form.Item label="姓名">
                <Input placeholder="你的名字" value={name} onChange={setName} />
              </Form.Item>
              <Form.Item label="邮箱">
                <Input placeholder="请输入邮箱" value={email} onChange={setEmail} type="email" />
              </Form.Item>
              <Form.Item label="密码">
                <Input placeholder="至少6位" value={password} onChange={setPassword} type="password" />
              </Form.Item>
            </Form>
            <Button block color="primary" loading={submitting} onClick={handleRegister} style={{ marginTop: 12 }}>
              注册
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
