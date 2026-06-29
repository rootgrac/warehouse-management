import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Card, List, Button, Dialog, Toast } from 'antd-mobile'
import { RightOutline } from 'antd-mobile-icons'

export default function Profile() {
  const { user, team, signOut } = useAuth()
  const navigate = useNavigate()

  function copyInviteCode() {
    if (team?.invite_code) {
      navigator.clipboard.writeText(team.invite_code)
        .then(() => Toast.show('邀请码已复制'))
        .catch(() => {
          // fallback
          const ta = document.createElement('textarea')
          ta.value = team.invite_code
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          document.body.removeChild(ta)
          Toast.show(`邀请码: ${team.invite_code}`)
        })
    }
  }

  async function handleSignOut() {
    const ok = await Dialog.confirm({ content: '确定退出吗？', confirmText: '退出' })
    if (ok) await signOut()
  }

  return (
    <div style={{ padding: '0 12px' }}>
      <h2 style={{ padding: '12px 4px 4px', fontSize: 18 }}>👤 我的</h2>

      <Card style={{ borderRadius: 12, marginTop: 8, padding: '16px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>👤</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{user?.name || '用户'}</div>
        <div style={{ color: '#999', fontSize: 13, marginTop: 4 }}>
          所属团队: {team?.name || '未加入'}
        </div>
      </Card>

      <List style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden' }} header="团队信息">
        <List.Item extra={team?.name || '-'}>团队名称</List.Item>
        <List.Item
          extra={team?.invite_code || '-'}
          clickable
          onClick={copyInviteCode}
          description="点击复制邀请码分享给同事"
        >
          邀请码
        </List.Item>
        <List.Item extra={team ? new Date(team.created_at).toLocaleDateString('zh-CN') : '-'}>
          创建时间
        </List.Item>
      </List>

      <List style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden' }}>
        <List.Item
          prefix={<span style={{ marginRight: 8 }}>📋</span>}
          extra={<RightOutline />}
          clickable
          onClick={() => navigate('/records')}
        >
          出入库流水记录
        </List.Item>
      </List>

      <div style={{ padding: '24px 0' }}>
        <Button block color="danger" onClick={handleSignOut}>退出</Button>
      </div>
    </div>
  )
}
