import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { AuthUser, SignInData, SignUpData, AuthError } from '@/types/auth.types'

interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: AuthError | null
  
  // Actions
  signIn: (data: SignInData) => Promise<{ success: boolean; error?: AuthError }>
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: AuthError }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: AuthError }>
  updatePassword: (password: string) => Promise<{ success: boolean; error?: AuthError }>
  
  // State setters
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: AuthError | null) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,

  signIn: async (data: SignInData) => {
    set({ loading: true, error: null })
    const supabase = createClient()
    
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        const authError: AuthError = { message: error.message }
        set({ error: authError, loading: false })
        return { success: false, error: authError }
      }

      if (authData.user) {
        // Fetch user profile with role from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (userError) {
          const authError: AuthError = { message: 'Failed to fetch user profile' }
          set({ error: authError, loading: false })
          return { success: false, error: authError }
        }

        const user: AuthUser = {
          id: authData.user.id,
          email: authData.user.email!,
          role: userData.role,
          email_confirmed_at: authData.user.email_confirmed_at,
          created_at: authData.user.created_at!,
          updated_at: userData.updated_at,
        }

        set({ user, loading: false, error: null })
        return { success: true }
      }

      return { success: false, error: { message: 'Authentication failed' } }
    } catch (err) {
      const authError: AuthError = { message: 'An unexpected error occurred' }
      set({ error: authError, loading: false })
      return { success: false, error: authError }
    }
  },

  signUp: async (data: SignUpData) => {
    set({ loading: true, error: null })
    const supabase = createClient()
    
    try {
      // Simple registration with email confirmation disabled
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { role: data.role },
          emailRedirectTo: undefined // Disable email confirmation completely
        }
      })

      if (error) {
        const authError: AuthError = { message: error.message }
        set({ error: authError, loading: false })
        return { success: false, error: authError }
      }

      if (authData.user) {
        // Create user profile manually (since trigger isn't working)
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: data.email,
            role: data.role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) {
          // Check if user already exists
          if (insertError.code === '23505') { // Unique constraint violation
            console.log('User already exists, fetching existing profile')
          } else {
            console.error('Failed to create user profile:', insertError)
            const authError: AuthError = { message: `Database error: ${insertError.message}` }
            set({ error: authError, loading: false })
            return { success: false, error: authError }
          }
        }

        // Create user object for state
        const user: AuthUser = {
          id: authData.user.id,
          email: data.email,
          role: data.role,
          email_confirmed_at: authData.user.email_confirmed_at,
          created_at: authData.user.created_at!,
          updated_at: new Date().toISOString(),
        }
        
        set({ user, loading: false })
        return { success: true }
      }

      set({ loading: false })
      return { success: true }
    } catch (error) {
      console.error('Signup error:', error)
      const authError: AuthError = { message: 'Registration failed. Please try again.' }
      set({ error: authError, loading: false })
      return { success: false, error: authError }
    }
  },

  signOut: async () => {
    set({ loading: true })
    const supabase = createClient()
    
    await supabase.auth.signOut()
    set({ user: null, loading: false, error: null })
  },

  resetPassword: async (email: string) => {
    set({ loading: true, error: null })
    const supabase = createClient()
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        const authError: AuthError = { message: error.message }
        set({ error: authError, loading: false })
        return { success: false, error: authError }
      }

      set({ loading: false, error: null })
      return { success: true }
    } catch (err) {
      const authError: AuthError = { message: 'An unexpected error occurred' }
      set({ error: authError, loading: false })
      return { success: false, error: authError }
    }
  },

  updatePassword: async (password: string) => {
    set({ loading: true, error: null })
    const supabase = createClient()
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        const authError: AuthError = { message: error.message }
        set({ error: authError, loading: false })
        return { success: false, error: authError }
      }

      set({ loading: false, error: null })
      return { success: true }
    } catch (err) {
      const authError: AuthError = { message: 'An unexpected error occurred' }
      set({ error: authError, loading: false })
      return { success: false, error: authError }
    }
  },

  // State setters
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))
