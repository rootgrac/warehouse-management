import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查当前登录状态
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadTeam(session.user.id)
      else setLoading(false)
    })

    // 监听登录状态变化
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadTeam(session.user.id)
      else { setTeam(null); setLoading(false) }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function loadTeam(userId) {
    // 查询用户所属团队
    const { data: member } = await supabase
      .from('team_members')
      .select('team_id, teams(*)')
      .eq('user_id', userId)
      .single()

    if (member) {
      setTeam(member.teams)
    }
    setLoading(false)
  }

  async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    // 设置用户显示名
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, display_name: name })
    }
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setTeam(null)
  }

  async function createTeam(name) {
    const { data, error } = await supabase
      .from('teams')
      .insert({ name, invite_code: generateCode() })
      .select()
      .single()
    if (error) throw error

    // 创建者自动加入团队
    await supabase.from('team_members').insert({ team_id: data.id, user_id: user.id })
    setTeam(data)
    return data
  }

  async function joinTeam(inviteCode) {
    // 根据邀请码查找团队
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single()
    if (teamError || !teamData) throw new Error('邀请码无效')

    // 加入团队
    const { error: joinError } = await supabase
      .from('team_members')
      .insert({ team_id: teamData.id, user_id: user.id })
    if (joinError) throw joinError

    setTeam(teamData)
    return teamData
  }

  async function refreshTeam() {
    if (user) await loadTeam(user.id)
  }

  return (
    <AuthContext.Provider value={{
      user, team, loading,
      signUp, signIn, signOut,
      createTeam, joinTeam, refreshTeam,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}
