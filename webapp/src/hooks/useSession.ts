import { useCallback, useEffect, useState } from 'react'
import { signup, getUser, login, User, WebSignupPayload } from './useApi'

const STORAGE_KEY = 'deutschly:web-user'

export function useSession() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      setLoading(false)
      return
    }
    let id: number
    try {
      const parsed = JSON.parse(saved)
      id = parsed.id
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      setLoading(false)
      return
    }
    getUser(id)
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const signIn = useCallback(async (payload: WebSignupPayload) => {
    const created = await signup(payload)
    setUser(created)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: created.id }))
    return created
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const signInWithPassword = useCallback(async (username: string, password: string) => {
    const u = await login({ username, password })
    setUser(u)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: u.id }))
    return u
  }, [])

  const refresh = useCallback(async () => {
    if (!user) return null
    const next = await getUser(user.id)
    setUser(next)
    return next
  }, [user])

  return { user, loading, signIn, signOut, refresh, setUser, signInWithPassword }
}
