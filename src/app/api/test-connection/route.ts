// Simple Supabase connection test
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test basic connection by trying to query a simple table or system info
    const { error } = await supabase
      .from('designer_profiles')
      .select('count(*)', { count: 'exact', head: true })
    
    if (error) {
      console.log('Connection test error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        connectionStatus: 'Connected but query failed',
        details: error
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful!',
      connectionStatus: 'Connected and working',
      tableExists: true
    })
    
  } catch (error) {
    console.error('Connection test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      connectionStatus: 'Connection failed',
      details: error
    }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
