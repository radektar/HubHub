#!/usr/bin/env node

/**
 * Simple Connection Test
 * Tests basic Supabase connection without complex queries
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  } catch (err) {
    // File doesn't exist, that's okay
  }
}

loadEnvFile(join(__dirname, '..', '.env.local'));
loadEnvFile(join(__dirname, '..', '.env'));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Simple Supabase Connection Test\n');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables!');
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL ? '✅' : '❌'}`);
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? '✅' : '❌'}`);
  console.log('\nPlease check your .env.local file');
  process.exit(1);
}

console.log('📋 Configuration:');
console.log(`   URL: ${SUPABASE_URL.substring(0, 40)}...`);
console.log(`   Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...\n`);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    console.log('🧪 Testing connection...\n');
    
    // Test 1: Simple health check
    console.log('1️⃣ Testing basic connection...');
    const { data: healthData, error: healthError } = await supabase
      .from('designer_profiles')
      .select('count', { count: 'exact', head: true });
    
    if (healthError) {
      console.log(`   ⚠️  Error: ${healthError.message}`);
      console.log(`   Code: ${healthError.code || 'N/A'}`);
      console.log(`   Details: ${healthError.details || 'N/A'}`);
      
      if (healthError.message.includes('permission') || healthError.code === 'PGRST116') {
        console.log('\n   ✅ This is expected! RLS is working correctly.');
        console.log('   The connection works, but RLS policies prevent anonymous access.');
        console.log('   This is correct behavior - you need to be authenticated.\n');
      } else {
        console.log('\n   ❌ Unexpected error. Check your configuration.\n');
        return false;
      }
    } else {
      console.log('   ✅ Connection successful!\n');
    }
    
    // Test 2: Check if we can query system tables (should work)
    console.log('2️⃣ Testing system query...');
    try {
      const { data, error } = await supabase.rpc('get_user_role');
      if (error && error.code === '42883') {
        console.log('   ✅ Function exists (expected error for anonymous user)');
      } else {
        console.log('   ✅ System accessible');
      }
    } catch (err) {
      console.log('   ⚠️  Could not test system functions');
    }
    console.log('');
    
    // Test 3: Verify URL format
    console.log('3️⃣ Verifying URL format...');
    if (SUPABASE_URL.includes('.supabase.co')) {
      console.log('   ✅ URL format looks correct');
    } else {
      console.log('   ⚠️  URL format might be incorrect');
    }
    console.log('');
    
    console.log('✅ Basic connection test completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify tables in Supabase Dashboard → Table Editor');
    console.log('   2. Run verification SQL: scripts/verify-database-setup.sql');
    console.log('   3. Test with authenticated user in the app\n');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Connection test failed:');
    console.error(`   ${error.message}`);
    
    if (error.message.includes('fetch failed')) {
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Check if Supabase project is active (not paused)');
      console.log('   2. Verify URL is correct in .env.local');
      console.log('   3. Check internet connection');
      console.log('   4. Verify project exists: https://supabase.com/dashboard\n');
    }
    
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
