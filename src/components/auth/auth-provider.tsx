'use client'

import { createContext, useContext, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { AuthUser } from '@/types/auth.types'

const AuthContext = createContext<Record<string, never>>({})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Fetch user profile with role
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (userData) {
          const user: AuthUser = {
            id: session.user.id,
            email: session.user.email!,
            role: userData.role,
            email_confirmed_at: session.user.email_confirmed_at,
            created_at: session.user.created_at!,
            updated_at: userData.updated_at,
          }
          setUser(user)
        }
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Fetch user profile with role
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (userData) {
            const user: AuthUser = {
              id: session.user.id,
              email: session.user.email!,
              role: userData.role,
              email_confirmed_at: session.user.email_confirmed_at,
              created_at: session.user.created_at!,
              updated_at: userData.updated_at,
            }
            setUser(user)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setLoading])

  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
