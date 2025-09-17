// Database verification script
// Run with: node scripts/verify-database.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function verifyDatabase() {
  console.log('🔍 Verifying database structure...')
  
  try {
    // Check if main tables exist
    const tables = [
      'users',
      'designer_profiles',
      'work_experiences',
      'skills',
      'languages',
      'educations',
      'projects',
      'offers'
    ]
    
    for (const table of tables) {
      console.log(`\n📋 Checking table: ${table}`)
      
      // Try to get table structure
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ Error accessing ${table}:`, error.message)
      } else {
        console.log(`✅ Table ${table} exists with ${count || 0} rows`)
      }
    }
    
    // Check specific table structures
    console.log('\n🔍 Checking designer_profiles structure...')
    const { data: profileData, error: profileError } = await supabase
      .from('designer_profiles')
      .select('*')
      .limit(1)
    
    if (!profileError && profileData) {
      console.log('✅ designer_profiles columns:', Object.keys(profileData[0] || {}))
    }
    
    // Check if database functions exist
    console.log('\n🔍 Checking database functions...')
    const { data: functions, error: funcError } = await supabase.rpc('check_profile_completion', { profile_id: '00000000-0000-0000-0000-000000000000' })
    
    if (funcError && !funcError.message.includes('does not exist')) {
      console.log('✅ check_profile_completion function exists')
    } else if (funcError && funcError.message.includes('does not exist')) {
      console.log('❌ check_profile_completion function missing')
    }
    
    console.log('\n✅ Database verification complete!')
    
  } catch (error) {
    console.error('❌ Database verification failed:', error)
  }
}

verifyDatabase()


