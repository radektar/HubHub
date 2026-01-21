#!/usr/bin/env node

/**
 * Verify Environment Configuration
 * Checks if .env.local has correct format
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const env = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          env[key.trim()] = value.trim();
        }
      }
    }
    return env;
  } catch (err) {
    return null;
  }
}

const env = loadEnvFile(join(__dirname, '..', '.env.local'));

console.log('🔍 Verifying Environment Configuration\n');

if (!env) {
  console.error('❌ Could not read .env.local file');
  process.exit(1);
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('📋 Configuration Check:\n');

// Check URL
console.log('1️⃣ NEXT_PUBLIC_SUPABASE_URL:');
if (!url) {
  console.log('   ❌ Not set');
} else {
  console.log(`   ✅ Set: ${url.substring(0, 40)}...`);
  console.log(`   Length: ${url.length} characters`);
  
  if (!url.includes('.supabase.co')) {
    console.log('   ⚠️  Warning: URL format may be incorrect');
    console.log('   Expected format: https://[project-ref].supabase.co');
  } else {
    console.log('   ✅ Format looks correct');
  }
  
  if (url.includes('your-project-id') || url.includes('example')) {
    console.log('   ❌ Still contains placeholder value!');
  }
}
console.log('');

// Check Key
console.log('2️⃣ NEXT_PUBLIC_SUPABASE_ANON_KEY:');
if (!key) {
  console.log('   ❌ Not set');
} else {
  console.log(`   ✅ Set: ${key.substring(0, 30)}...`);
  console.log(`   Length: ${key.length} characters`);
  
  if (!key.startsWith('eyJ')) {
    console.log('   ⚠️  Warning: Key should start with "eyJ" (JWT format)');
  } else {
    console.log('   ✅ Format looks correct (JWT)');
  }
  
  if (key.length < 100) {
    console.log('   ⚠️  Warning: Key seems too short (should be ~200+ characters)');
  }
  
  if (key.includes('your-anon-key') || key.includes('example')) {
    console.log('   ❌ Still contains placeholder value!');
  }
}
console.log('');

// Summary
console.log('📊 Summary:');
const urlOk = url && url.includes('.supabase.co') && !url.includes('your-project-id');
const keyOk = key && key.startsWith('eyJ') && key.length > 100 && !key.includes('your-anon-key');

if (urlOk && keyOk) {
  console.log('   ✅ Configuration looks correct!');
  console.log('\n💡 Next step: Test connection');
  console.log('   node scripts/test-connection-simple.mjs\n');
} else {
  console.log('   ⚠️  Configuration needs attention');
  console.log('\n📝 How to fix:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/settings/api');
  console.log('   2. Copy Project URL and anon/public key');
  console.log('   3. Update .env.local with correct values\n');
}
