'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AuthDebugPage() {
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testSupabaseConnection = async () => {
    setLoading(true)
    setResults([])
    
    try {
      addResult('🚀 Starting Supabase connection test...')
      
      // Check environment variables
      const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
      const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      addResult(`Environment check - URL: ${hasUrl ? '✅' : '❌'}, Key: ${hasKey ? '✅' : '❌'}`)
      
      if (!hasUrl || !hasKey) {
        addResult('❌ Missing environment variables')
        return
      }
      
      const supabase = createClient()
      addResult('✅ Supabase client created')
      
      // Test session with timeout
      addResult('🔍 Testing session retrieval...')
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 10000)
      )
      
      const result = await Promise.race([
        sessionPromise,
        timeoutPromise
      ])
      
      const { data: { session }, error: sessionError } = result as { data: { session: unknown }; error: unknown }
      const typedSession = session as { user?: { id: string; email?: string } } | null
      
      if (sessionError) {
        addResult(`⚠️ Session error: ${sessionError instanceof Error ? sessionError.message : 'Unknown error'}`)
      } else {
        addResult(`✅ Session retrieved - User: ${typedSession?.user ? 'Found' : 'None'}`)
        if (typedSession?.user) {
          addResult(`👤 User ID: ${typedSession.user.id}`)
          addResult(`📧 Email: ${typedSession.user.email || 'No email'}`)
          addResult(`✅ Email confirmed: ${(session as { user?: { email_confirmed_at?: string } })?.user?.email_confirmed_at ? 'Yes' : 'No'}`)
        }
      }
      
      // Test database connection if we have a user
      if (typedSession?.user) {
        addResult('🔍 Testing database connection...')
        const dbPromise = supabase
          .from('users')
          .select('*')
          .eq('id', typedSession.user.id)
          .single()
        
        const dbTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 8000)
        )
        
        const dbResult = await Promise.race([
          dbPromise,
          dbTimeoutPromise
        ])
        
        const { data: userData, error: dbError } = dbResult as { data: unknown; error: unknown }
        
        if (dbError) {
          addResult(`❌ Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`)
        } else {
          addResult(`✅ Database connection working`)
          addResult(`👤 User role: ${(userData as { role?: string })?.role || 'Not set'}`)
          addResult(`📅 Created: ${(userData as { created_at?: string })?.created_at || 'Not set'}`)
        }
      }
      
      addResult('🎉 Connection test completed!')
      
    } catch (error) {
      addResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    setResults([])
    
    try {
      addResult('🔐 Testing login process...')
      
      const supabase = createClient()
      
      // You can modify these credentials for testing
      const testEmail = 'test@hubhub.com'
      const testPassword = 'TestPassword123!'
      
      addResult(`📧 Attempting login with: ${testEmail}`)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })
      
      if (error) {
        addResult(`❌ Login failed: ${error.message}`)
      } else {
        addResult(`✅ Login successful!`)
        addResult(`👤 User ID: ${data.user?.id}`)
        addResult(`📧 Email: ${data.user?.email}`)
        addResult(`✅ Email confirmed: ${data.user?.email_confirmed_at ? 'Yes' : 'No'}`)
        
        // Test database access after login
        const { data: userData, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user?.id)
          .single()
        
        if (dbError) {
          addResult(`⚠️ Database access after login failed: ${dbError.message}`)
        } else {
          addResult(`✅ Database access working - Role: ${userData?.role}`)
        }
      }
      
    } catch (error) {
      addResult(`❌ Login test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Authentication Debug Tool</h1>
          <p className="text-gray-600 mt-2">
            Test Supabase connection and authentication flow
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connection Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={testSupabaseConnection} 
                  disabled={loading}
                  variant="default"
                >
                  {loading ? 'Testing...' : 'Test Supabase Connection'}
                </Button>
                
                <Button 
                  onClick={testLogin} 
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? 'Testing...' : 'Test Login Flow'}
                </Button>
              </div>
              
              {results.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-3">Test Results:</h3>
                  <div className="bg-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto">
                    {results.map((result, index) => (
                      <div key={index} className="font-mono text-sm text-gray-800 mb-1">
                        {result}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Environment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm">
                <div>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</div>
                <div>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</div>
                <div>Node Environment: {process.env.NODE_ENV}</div>
                <div>URL (partial): {process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
