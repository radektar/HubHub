import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.log('🔍 Debug: Checking profile for user:', user.id)
    
    // Check if user exists in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    console.log('👤 User data:', userData, 'Error:', userError)
    
    // Check if designer profile exists
    const { data: profileData, error: profileError } = await supabase
      .from('designer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    console.log('📋 Profile data:', profileData, 'Error:', profileError)
    
    // Test table existence and check related data
    const relatedData: Record<string, unknown[]> = {}
    const tableTests: Record<string, { exists: boolean; rowCount?: number; error?: string }> = {}
    
    if (profileData) {
      // Test each table individually to see which ones exist
      const tableTestPromises = [
        supabase.from('work_experiences').select('*').eq('designer_profile_id', profileData.id).then(r => ({ table: 'work_experiences', ...r })),
        supabase.from('skills').select('*').eq('designer_profile_id', profileData.id).then(r => ({ table: 'skills', ...r })),
        supabase.from('languages').select('*').eq('designer_profile_id', profileData.id).then(r => ({ table: 'languages', ...r })),
        supabase.from('educations').select('*').eq('designer_profile_id', profileData.id).then(r => ({ table: 'educations', ...r })),
        supabase.from('education').select('*').eq('designer_profile_id', profileData.id).then(r => ({ table: 'education', ...r })) // Test both names
      ]
      
      const results = await Promise.allSettled(tableTestPromises)
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { table, data, error } = result.value as { table: string; data: unknown[]; error: { code?: string; message?: string } | null }
          tableTests[table] = {
            exists: !error || error.code !== '42P01', // 42P01 = table doesn't exist
            rowCount: data?.length || 0,
            error: error?.message
          }
          if (!error) {
            relatedData[table] = data || []
          }
        } else {
          const tableName = ['work_experiences', 'skills', 'languages', 'educations', 'education'][index]
          tableTests[tableName] = {
            exists: false,
            error: result.reason?.message || 'Promise rejected'
          }
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: userData?.role
      },
      profile: profileData,
      relatedData,
      tableTests,
      errors: {
        userError: userError?.message,
        profileError: profileError?.message
      }
    })
    
  } catch (error) {
    console.error('❌ Debug profile check error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
