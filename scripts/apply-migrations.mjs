// Apply database migrations
// Run with: node scripts/apply-migrations.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// You'll need to set these environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  console.log('\nPlease set these environment variables and try again.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigrations() {
  console.log('🚀 Applying database migrations...')
  
  try {
    // Read the main schema migration
    const schemaSql = readFileSync('supabase/migrations/20250906143602_create_hubhub_schema.sql', 'utf8')
    
    console.log('📋 Applying main schema migration...')
    const { data, error } = await supabase.rpc('exec_sql', { sql: schemaSql })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      return
    }
    
    console.log('✅ Schema migration applied successfully!')
    
    // Verify tables were created
    console.log('\n🔍 Verifying tables...')
    const tables = ['designer_profiles', 'work_experiences', 'skills', 'languages']
    
    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: Created successfully`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error applying migrations:', error)
  }
}

applyMigrations()


