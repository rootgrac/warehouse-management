import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SpinLoading } from 'antd-mobile'
import Login from './pages/Login'
import Home from './pages/Home'
import Records from './pages/Records'

function AppRoutes() {
  const { user, team, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <SpinLoading color="primary" style={{ '--size': '48px' }} />
      </div>
    )
  }

  // 未登录 → 登录页
  if (!user) return <Login />

  // 已登录但未加入团队 → 提示创建/加入（在 Login 页处理）
  if (!team) return <Login showTeamSetup />

  // 正常使用
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/records" element={<Records />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  )
}
