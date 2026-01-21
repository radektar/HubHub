'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      // Handle both hash and query parameter formats
      // Supabase can send: code, token_hash, token, or access_token/refresh_token
      let code = searchParams.get('code')
      let tokenHash = searchParams.get('token_hash') || searchParams.get('token')
      let type = searchParams.get('type')
      let accessToken = searchParams.get('access_token')
      let refreshToken = searchParams.get('refresh_token')

      // Check if parameters are in the URL hash (common for Supabase)
      if (typeof window !== 'undefined') {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        code = code || hashParams.get('code')
        tokenHash = tokenHash || hashParams.get('token_hash') || hashParams.get('token') || hashParams.get('access_token')
        type = type || hashParams.get('type')
        accessToken = accessToken || hashParams.get('access_token')
        refreshToken = refreshToken || hashParams.get('refresh_token')
      }

      console.log('Verification parameters:', { code, tokenHash, type, accessToken, refreshToken })

      // If we have access_token and refresh_token, the user is already verified
      if (accessToken && refreshToken) {
        const supabase = createClient()
        
        try {
          // Set the session with the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            console.error('Session setup error:', error)
            setStatus('error')
            setMessage(error.message || 'Failed to complete email verification.')
            return
          }

          if (data.user) {
            setStatus('success')
            setMessage('Email verified successfully! You can now sign in to your account.')
            
            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
              router.push('/dashboard')
            }, 3000)
          }
          return
        } catch (err) {
          console.error('Session setup error:', err)
          setStatus('error')
          setMessage('An unexpected error occurred during verification.')
          return
        }
      }

      // Try code-based verification first (most common for Supabase email links)
      // For code from redirect URL, use exchangeCodeForSession
      if (code) {
        const supabase = createClient()
        
        try {
          // Exchange code for session (standard Supabase email verification flow)
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error('Email verification error (code):', error)
            setStatus('error')
            
            if (error.message.includes('expired')) {
              setMessage('The verification link has expired. Please request a new verification email.')
            } else if (error.message.includes('invalid')) {
              setMessage('Invalid verification link. Please check your email for the correct link.')
            } else {
              setMessage(error.message || 'Failed to verify email. Please try again.')
            }
            return
          }

          if (data.user) {
            setStatus('success')
            setMessage('Email verified successfully! You can now sign in to your account.')
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
              router.push('/auth/login')
            }, 3000)
          }
          return
        } catch (err) {
          console.error('Unexpected error (code verification):', err)
          setStatus('error')
          setMessage('An unexpected error occurred. Please try again or contact support.')
          return
        }
      }

      // Fallback to token_hash verification if no code
      if (!tokenHash || (type && type !== 'signup')) {
        setStatus('error')
        setMessage('Invalid verification link. Please check your email for the correct link or request a new verification email.')
        return
      }

      const supabase = createClient()

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'signup'
        })

        if (error) {
          console.error('Email verification error:', error)
          setStatus('error')
          
          // Provide more specific error messages
          if (error.message.includes('expired')) {
            setMessage('The verification link has expired. Please request a new verification email.')
          } else if (error.message.includes('invalid')) {
            setMessage('Invalid verification link. Please check your email for the correct link.')
          } else {
            setMessage(error.message || 'Failed to verify email. Please try again.')
          }
          return
        }

        if (data.user) {
          setStatus('success')
          setMessage('Email verified successfully! You can now sign in to your account.')
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/auth/login')
          }, 3000)
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again or contact support.')
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Verifying your email address...'}
            {status === 'success' && 'Email verified successfully!'}
            {status === 'error' && 'Verification failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <div className="text-green-600 text-lg">✅</div>
              <p className="text-sm text-gray-600">{message}</p>
              <p className="text-xs text-gray-500">Redirecting to login page...</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <div className="text-red-600 text-lg">❌</div>
              <p className="text-sm text-gray-600">{message}</p>
              <div className="space-y-2">
                {message.includes('expired') ? (
                  <>
                    <Button 
                      onClick={() => router.push('/auth/register')} 
                      className="w-full"
                    >
                      Request New Verification Email
                    </Button>
                    <Button 
                      onClick={() => router.push('/auth/login')} 
                      variant="outline"
                      className="w-full"
                    >
                      Try Signing In
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={() => router.push('/auth/register')} 
                      variant="outline"
                      className="w-full"
                    >
                      Try Signing Up Again
                    </Button>
                    <Button 
                      onClick={() => router.push('/auth/login')} 
                      className="w-full"
                    >
                      Go to Login
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Email Verification</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
