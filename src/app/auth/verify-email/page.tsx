'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')
      const type = searchParams.get('type')

      if (!token || type !== 'signup') {
        setStatus('error')
        setMessage('Invalid verification link. Please check your email for the correct link.')
        return
      }

      const supabase = createClient()

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        })

        if (error) {
          console.error('Email verification error:', error)
          setStatus('error')
          setMessage(error.message || 'Failed to verify email. The link may have expired.')
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
        setMessage('An unexpected error occurred. Please try again.')
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
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
