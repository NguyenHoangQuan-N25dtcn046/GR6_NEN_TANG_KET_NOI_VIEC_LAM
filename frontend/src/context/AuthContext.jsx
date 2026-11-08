import { createContext, useContext, useEffect, useState } from 'react'
import { clearAuth, getRole, getToken, setAuth } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => ({
    token: getToken(),
    role: getRole(),
  }))

  useEffect(() => {
    if (!user.token) clearAuth()
  }, [user.token])

  const login = (token, role) => {
    setAuth(token, role)
    setUser({ token, role })
  }

  const logout = () => {
    clearAuth()
    setUser({ token: null, role: null })
  }

  const value = {
    token: user.token,
    role: user.role,
    isAuthenticated: !!user.token,
    isCandidate: user.role === 'candidate',
    isEmployer: user.role === 'employer',
    isAdmin: user.role === 'admin',
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
