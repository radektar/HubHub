#!/usr/bin/env node

/**
 * Supabase Database Backup Restore Script
 * 
 * This script helps restore a PostgreSQL cluster backup to Supabase
 * 
 * Usage:
 *   1. Set environment variables in .env.local
 *   2. Run: node scripts/restore-backup.mjs <backup-file-path>
 * 
 * Requirements:
 *   - psql (PostgreSQL client) installed
 *   - SUPABASE_DB_PASSWORD from Supabase Dashboard → Settings → Database
 *   - Connection string from Supabase Dashboard → Settings → Database → Connection string
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
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
const backupFilePath = process.argv[2];

console.log('🔄 Supabase Database Backup Restore\n');

// Validate inputs
if (!backupFilePath) {
  console.error('❌ Error: Backup file path is required');
  console.log('\nUsage: node scripts/restore-backup.mjs <backup-file-path>');
  console.log('Example: node scripts/restore-backup.mjs ~/Downloads/db_cluster-24-09-2025@00-18-08.backup');
  process.exit(1);
}

if (!SUPABASE_URL) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
  console.log('\nPlease set it in .env.local file');
  process.exit(1);
}

// Extract database connection info from Supabase URL
// Format: https://[project-ref].supabase.co
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Error: Invalid Supabase URL format');
  console.log('Expected format: https://[project-ref].supabase.co');
  process.exit(1);
}

console.log('📋 Configuration:');
console.log(`   Project Reference: ${projectRef}`);
console.log(`   Backup File: ${backupFilePath}`);
console.log('');

// Check if backup file exists
try {
  const stats = readFileSync(backupFilePath);
  const fileSize = (stats.length / 1024).toFixed(2);
  console.log(`✅ Backup file found (${fileSize} KB)`);
} catch (error) {
  console.error(`❌ Error: Cannot read backup file: ${backupFilePath}`);
  console.error(`   ${error.message}`);
  process.exit(1);
}

// Instructions for manual restore
console.log('\n📖 IMPORTANT: Restore Instructions\n');
console.log('This backup is a PostgreSQL cluster dump that requires special handling.');
console.log('Supabase has specific roles and schemas that need to be preserved.\n');

console.log('🔧 Method 1: Restore via Supabase Dashboard (Recommended for small backups)\n');
console.log('1. Go to your Supabase Dashboard:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}\n`);
console.log('2. Navigate to: SQL Editor');
console.log('3. Open the backup file and copy its contents');
console.log('4. Paste into SQL Editor');
console.log('5. Click "Run" to execute\n');

console.log('⚠️  Note: Some commands in cluster dump may need to be skipped:');
console.log('   - Role creation (roles already exist in Supabase)');
console.log('   - Database creation (database already exists)');
console.log('   - Schema creation for system schemas (auth, storage, etc.)\n');

console.log('🔧 Method 2: Restore via psql (For advanced users)\n');
console.log('1. Get your database password from:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}/settings/database\n`);
console.log('2. Get connection string from the same page');
console.log('3. Run psql command:\n');
console.log(`   psql "postgresql://postgres:[YOUR-PASSWORD]@db.${projectRef}.supabase.co:5432/postgres" < ${backupFilePath}\n`);

console.log('⚠️  WARNING:');
console.log('   - This will overwrite existing data in your database');
console.log('   - Make sure you have a current backup before proceeding');
console.log('   - Some system roles and schemas may conflict\n');

console.log('💡 Recommended Approach:');
console.log('   1. Review the backup file first');
console.log('   2. Extract only the data you need (tables, inserts, etc.)');
console.log('   3. Skip system roles and schemas');
console.log('   4. Restore via SQL Editor in smaller chunks\n');

console.log('📝 Next Steps:');
console.log('   1. Review the backup file to understand its structure');
console.log('   2. Choose your restore method (Dashboard or psql)');
console.log('   3. After restore, verify connection with: node scripts/test-db-connection.mjs\n');
