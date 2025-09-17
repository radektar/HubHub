'use client'

import { createContext, useContext, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { AuthUser } from '@/types/auth.types'

const AuthContext = createContext<Record<string, never>>({})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore()

  console.log('AuthProvider: Component rendered')

  useEffect(() => {
    console.log('AuthProvider: useEffect started')
    console.log('AuthProvider: Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing')
    console.log('AuthProvider: Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing')
    
    const supabase = createClient()

    // Get initial session with improved error handling
    const getInitialSession = async () => {
      try {
        console.log('AuthProvider: Calling supabase.auth.getSession()')
        
        // Increase timeout and add better error handling
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout - Supabase connection issue')), 10000)
        )
        
        const result = await Promise.race([
          sessionPromise,
          timeoutPromise
        ])
        
        // Type guard to ensure we have the right result
        if (!result || typeof result !== 'object' || !('data' in result)) {
          throw new Error('Invalid session response from Supabase')
        }
        
        const { data: { session }, error: sessionError } = result as { data: { session: unknown }; error: unknown }
        
        console.log('AuthProvider: Session result:', session, 'Error:', sessionError)
        
        if (sessionError) {
          console.error('AuthProvider: Session error:', sessionError)
          // Don't throw, just log and continue
        }
        
        const typedSession = session as { user?: { id: string } } | null
        if (typedSession?.user) {
          console.log('AuthProvider: Session found, fetching user profile for ID:', typedSession.user.id)
          
          try {
            // Retry logic for database query
            let userData = null
            let error = null
            let retryCount = 0
            const maxRetries = 2
            
            while (retryCount <= maxRetries && !userData && !error) {
              try {
                const userQueryPromise = supabase
                  .from('users')
                  .select('*')
                  .eq('id', typedSession.user.id)
                  .single()
                
                const timeout = Math.min(8000 + (retryCount * 2000), 15000) // Increase timeout with retries
                const userTimeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Database query timeout')), timeout)
                )
                
                const result = await Promise.race([
                  userQueryPromise,
                  userTimeoutPromise
                ])
                
                const typedResult = result as { data: unknown; error: unknown }
                userData = typedResult.data
                error = typedResult.error
                
                if (userData || error) break // Success or database error (not timeout)
                
              } catch (timeoutError) {
                retryCount++
                if (retryCount <= maxRetries) {
                  console.log(`AuthProvider: Database query timeout, retrying (${retryCount}/${maxRetries})...`)
                  await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)) // Wait before retry
                } else {
                  throw timeoutError // Final timeout
                }
              }
            }

            console.log('AuthProvider: Database query result:', userData, 'Error:', error)

            if (error) {
              console.error('Error fetching user profile in AuthProvider:', error)
              // Create a basic user object without role if database fails
              const basicUser: AuthUser = {
                id: typedSession.user.id,
                email: (session as { user?: { email?: string } })?.user?.email || '',
                role: 'designer', // Default role if database fails
                email_confirmed_at: (session as { user?: { email_confirmed_at?: string } })?.user?.email_confirmed_at,
                created_at: (session as { user?: { created_at?: string } })?.user?.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
              console.log('AuthProvider: Setting basic user due to database error')
              setUser(basicUser)
            } else if (userData) {
              const user: AuthUser = {
                id: typedSession.user.id,
                email: (session as { user?: { email?: string } })?.user?.email || '',
                role: ((userData as { role?: string })?.role || 'designer') as 'admin' | 'designer',
                email_confirmed_at: (session as { user?: { email_confirmed_at?: string } })?.user?.email_confirmed_at,
                created_at: (session as { user?: { created_at?: string } })?.user?.created_at || new Date().toISOString(),
                updated_at: (userData as { updated_at?: string })?.updated_at || new Date().toISOString(),
              }
              console.log('AuthProvider: Setting user with role:', (userData as { role?: string })?.role)
              setUser(user)
            }
            } catch (dbError) {
              console.warn('AuthProvider: Database query failed (non-critical):', dbError instanceof Error ? dbError.message : 'Unknown error')
              // Still set a basic user object so login works
              const basicUser: AuthUser = {
                id: typedSession.user.id,
                email: (session as { user?: { email?: string } })?.user?.email || '',
                role: 'designer', // Default role - will be corrected on next successful query
                email_confirmed_at: (session as { user?: { email_confirmed_at?: string } })?.user?.email_confirmed_at,
                created_at: (session as { user?: { created_at?: string } })?.user?.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
              console.log('AuthProvider: Setting fallback user due to database query timeout (functionality preserved)')
              setUser(basicUser)
            }
        } else {
          console.log('AuthProvider: No session found')
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        // Don't block the app if initial session fails
        if (error instanceof Error && error.message.includes('timeout')) {
          console.warn('Supabase connection timeout - continuing without authentication')
        }
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes with improved error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          console.log('AuthProvider: Auth state change:', event, session?.user?.id)
          
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              // Fetch user profile with role and timeout
              const userQueryPromise = supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single()
              
              const userTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database query timeout')), 12000)
              )
              
              const result = await Promise.race([
                userQueryPromise,
                userTimeoutPromise
              ])

              const { data: userData, error } = result as { data: unknown; error: unknown }
              const sessionTyped = session as { user?: { id: string; email?: string; email_confirmed_at?: string; created_at?: string } } | null

              if (error) {
                console.error('Error fetching user profile on auth change:', error)
                // Set basic user without database role
                const basicUser: AuthUser = {
                  id: sessionTyped?.user?.id || '',
                  email: sessionTyped?.user?.email || '',
                  role: 'designer', // Default role
                  email_confirmed_at: sessionTyped?.user?.email_confirmed_at,
                  created_at: sessionTyped?.user?.created_at || new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }
                console.log('AuthProvider: Auth change - Setting basic user due to database error')
                setUser(basicUser)
              } else if (userData) {
                const user: AuthUser = {
                  id: sessionTyped?.user?.id || '',
                  email: sessionTyped?.user?.email || '',
                  role: ((userData as { role?: string })?.role || 'designer') as 'admin' | 'designer',
                  email_confirmed_at: sessionTyped?.user?.email_confirmed_at,
                  created_at: sessionTyped?.user?.created_at || new Date().toISOString(),
                  updated_at: (userData as { updated_at?: string })?.updated_at || new Date().toISOString(),
                }
                console.log('AuthProvider: Auth change - Setting user with role:', (userData as { role?: string })?.role)
                setUser(user)
              }
            } catch (dbError) {
              console.warn('AuthProvider: Database query failed in auth change (non-critical):', dbError instanceof Error ? dbError.message : 'Unknown error')
              // Still set a basic user so login works
              const basicUser: AuthUser = {
                id: session.user.id,
                email: session.user.email!,
                role: 'designer', // Default role - will be corrected on next successful query
                email_confirmed_at: session.user.email_confirmed_at,
                created_at: session.user.created_at!,
                updated_at: new Date().toISOString(),
              }
              console.log('AuthProvider: Auth change - Setting fallback user (functionality preserved)')
              setUser(basicUser)
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('AuthProvider: User signed out')
            setUser(null)
          }
        } catch (error) {
          console.error('Error in auth state change handler:', error)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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
