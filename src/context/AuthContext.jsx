import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as db from '../db'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  const refresh = useCallback(() => setVersion(v => v + 1), [])

  // 初始化：从 localStorage 恢复会话
  useEffect(() => {
    const savedUserId = localStorage.getItem('wm_user_id')
    const savedTeamId = localStorage.getItem('wm_team_id')
    if (savedUserId) {
      db.getUser(savedUserId).then(u => {
        if (u) {
          setUser(u)
          if (savedTeamId) {
            db.getTeam(savedTeamId).then(t => {
              if (t) setTeam(t)
              setLoading(false)
            }).catch(() => setLoading(false))
          } else {
            setLoading(false)
          }
        } else {
          setLoading(false)
        }
      }).catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [version])

  async function login(name, inviteCode) {
    const foundTeam = await db.getTeamByCode(inviteCode)
    if (!foundTeam) throw new Error('邀请码无效')

    const userId = 'u_' + Date.now()
    const newUser = await db.createUser(userId, name)

    try {
      await db.joinTeam(foundTeam.id, userId)
    } catch (e) {
      if (!e.message.includes('已在团队中')) throw e
    }

    localStorage.setItem('wm_user_id', userId)
    localStorage.setItem('wm_team_id', foundTeam.id)
    setUser(newUser)
    setTeam(foundTeam)
    return foundTeam
  }

  async function createTeamAndLogin(name, teamName) {
    const userId = 'u_' + Date.now()
    await db.createUser(userId, name)
    const inviteCode = db.generateInviteCode()
    const newTeam = await db.createTeam(teamName, inviteCode, userId)

    localStorage.setItem('wm_user_id', userId)
    localStorage.setItem('wm_team_id', newTeam.id)
    setUser({ id: userId, name, created_at: new Date().toISOString() })
    setTeam(newTeam)
    return newTeam
  }

  async function signOut() {
    localStorage.removeItem('wm_user_id')
    localStorage.removeItem('wm_team_id')
    setUser(null)
    setTeam(null)
  }

  return (
    <AuthContext.Provider value={{
      user, team, loading, refresh,
      login, createTeamAndLogin, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
