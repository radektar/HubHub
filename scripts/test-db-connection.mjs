#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests Supabase database connection and basic queries
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local or .env manually
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

// Try to load .env files
loadEnvFile(join(__dirname, '..', '.env.local'));
loadEnvFile(join(__dirname, '..', '.env'));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Database Connection...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`   SUPABASE_URL: ${SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`   SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}\n`);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables!');
  console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  const results = {
    connection: false,
    tables: {},
    errors: []
  };

  try {
    // Test 1: Basic connection - query a simple table
    console.log('🧪 Test 1: Basic Connection Test');
    try {
      const { data, error } = await supabase
        .from('designer_profiles')
        .select('count(*)', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.errors.push({ test: 'Basic Connection', error: error.message });
      } else {
        console.log('   ✅ Connection successful!');
        results.connection = true;
        console.log(`   📊 Designer profiles count: ${data || 'N/A'}\n`);
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
      results.errors.push({ test: 'Basic Connection', error: err.message });
    }

    // Test 2: Check if main tables exist
    console.log('🧪 Test 2: Table Existence Check');
    const tables = [
      'designer_profiles',
      'skills',
      'work_experiences',
      'languages',
      'educations',  // Fixed: table name is 'educations' (plural)
      'projects'
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(0);
        
        if (error) {
          console.log(`   ❌ Table '${table}': ${error.message}`);
          results.tables[table] = false;
          results.errors.push({ test: `Table ${table}`, error: error.message });
        } else {
          console.log(`   ✅ Table '${table}': Exists`);
          results.tables[table] = true;
        }
      } catch (err) {
        console.log(`   ❌ Table '${table}': ${err.message}`);
        results.tables[table] = false;
        results.errors.push({ test: `Table ${table}`, error: err.message });
      }
    }
    console.log('');

    // Test 3: Test RLS policies (try to read without auth)
    console.log('🧪 Test 3: RLS Policy Check');
    try {
      const { data, error } = await supabase
        .from('designer_profiles')
        .select('id, name, title')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('permission')) {
          console.log('   ⚠️  RLS policies are active (expected behavior)');
          console.log(`   📝 Error: ${error.message}`);
        } else {
          console.log(`   ❌ Unexpected error: ${error.message}`);
          results.errors.push({ test: 'RLS Check', error: error.message });
        }
      } else {
        console.log('   ✅ RLS allows read access (or policies are disabled)');
        if (data && data.length > 0) {
          console.log(`   📊 Sample record: ${JSON.stringify(data[0])}`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
      results.errors.push({ test: 'RLS Check', error: err.message });
    }
    console.log('');

    // Test 4: Check database schema version
    console.log('🧪 Test 4: Schema Information');
    try {
      const { data, error } = await supabase
        .from('designer_profiles')
        .select('*')
        .limit(0);
      
      if (!error) {
        console.log('   ✅ Schema accessible');
        // Try to get column info by attempting a select with specific columns
        const { error: colError } = await supabase
          .from('designer_profiles')
          .select('id, user_id, name, title, email, phone, availability, portfolio_url, cv_file_url, professional_summary, total_experience_years, is_profile_complete')
          .limit(0);
        
        if (!colError) {
          console.log('   ✅ MVP required fields present in schema');
        } else {
          console.log(`   ⚠️  Some fields may be missing: ${colError.message}`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
    console.log('');

    // Summary
    console.log('📊 Test Summary:');
    console.log(`   Connection: ${results.connection ? '✅ Success' : '❌ Failed'}`);
    const tablesOk = Object.values(results.tables).filter(v => v).length;
    const tablesTotal = Object.keys(results.tables).length;
    console.log(`   Tables: ${tablesOk}/${tablesTotal} accessible`);
    console.log(`   Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.test}: ${err.error}`);
      });
    }

    if (results.connection && tablesOk === tablesTotal) {
      console.log('\n✅ Database connection test PASSED!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Database connection test completed with issues');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Fatal error during connection test:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testConnection();
