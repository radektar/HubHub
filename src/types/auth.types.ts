// Authentication types for HubHub platform

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  email_confirmed_at?: string
  created_at: string
  updated_at: string
}

export type UserRole = 'designer' | 'client' | 'admin'

export interface SignUpData {
  email: string
  password: string
  role: UserRole
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthError {
  message: string
  status?: number
}

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: AuthError | null
}

// Form validation schemas
export interface SignUpFormData {
  email: string
  password: string
  confirmPassword: string
  role: UserRole
  acceptTerms: boolean
}

export interface SignInFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface ResetPasswordFormData {
  email: string
}

export interface UpdatePasswordFormData {
  password: string
  confirmPassword: string
}
