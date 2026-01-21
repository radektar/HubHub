#!/usr/bin/env node

/**
 * Execute Supabase Database Restore
 * 
 * This script helps restore the prepared backup to Supabase
 * It provides multiple methods for restoration
 * 
 * Usage:
 *   node scripts/execute-restore.mjs [prepared-sql-file]
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

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
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const preparedSqlFile = process.argv[2] || '/Users/tarhaskha/Downloads/db_cluster-24-09-2025@00-18-08_prepared.sql';

console.log('🔄 Supabase Database Restore Execution\n');

// Validate inputs
if (!SUPABASE_URL) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
  console.log('\nPlease set it in .env.local file');
  process.exit(1);
}

if (!existsSync(preparedSqlFile)) {
  console.error(`❌ Error: Prepared SQL file not found: ${preparedSqlFile}`);
  console.log('\nPlease run: node scripts/prepare-backup-for-restore.mjs <backup-file>');
  process.exit(1);
}

// Extract project reference
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Error: Invalid Supabase URL format');
  process.exit(1);
}

console.log('📋 Configuration:');
console.log(`   Project Reference: ${projectRef}`);
console.log(`   Prepared SQL File: ${preparedSqlFile}`);
console.log(`   Service Role Key: ${SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Not set'}\n`);

// Read SQL file
let sqlContent;
try {
  sqlContent = readFileSync(preparedSqlFile, 'utf-8');
  const fileSize = (sqlContent.length / 1024).toFixed(2);
  console.log(`✅ SQL file loaded (${fileSize} KB)\n`);
} catch (error) {
  console.error(`❌ Error reading SQL file: ${error.message}`);
  process.exit(1);
}

// Check if psql is available
let psqlAvailable = false;
try {
  execSync('which psql', { stdio: 'ignore' });
  psqlAvailable = true;
} catch (error) {
  psqlAvailable = false;
}

console.log('📖 Restore Options:\n');

console.log('═══════════════════════════════════════════════════════════════');
console.log('OPTION 1: Restore via Supabase Dashboard SQL Editor (RECOMMENDED)');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('1. Open Supabase Dashboard:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql\n`);
console.log('2. Copy the SQL file content:');
console.log(`   cat ${preparedSqlFile} | pbcopy  # macOS`);
console.log(`   # Or open the file and copy manually\n`);
console.log('3. Paste into SQL Editor and click "Run"\n');
console.log('4. Check for any errors and verify tables\n');

if (psqlAvailable && SUPABASE_SERVICE_KEY) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('OPTION 2: Restore via psql (Requires Database Password)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('⚠️  To use this method, you need:');
  console.log('   1. Database password from Supabase Dashboard');
  console.log('   2. Go to: Settings → Database → Database password\n');
  console.log('Then run:');
  console.log(`   psql "postgresql://postgres:[PASSWORD]@db.${projectRef}.supabase.co:5432/postgres" \\`);
  console.log(`     -f ${preparedSqlFile}\n`);
} else {
  if (!psqlAvailable) {
    console.log('⚠️  psql not found. Install PostgreSQL client to use psql method.\n');
  }
  if (!SUPABASE_SERVICE_KEY) {
    console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY not set. Set it in .env.local for API method.\n');
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('OPTION 3: Restore in Chunks (For Large Files)');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('If the SQL file is too large, split it into smaller chunks:\n');
console.log('1. Split by statements:');
console.log(`   # Extract CREATE TABLE statements`);
console.log(`   grep -A 50 "CREATE TABLE" ${preparedSqlFile} > tables.sql\n`);
console.log(`   # Extract INSERT statements`);
console.log(`   grep "INSERT INTO" ${preparedSqlFile} > data.sql\n`);
console.log('2. Restore tables first, then data\n');

console.log('═══════════════════════════════════════════════════════════════');
console.log('VERIFICATION');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('After restore, verify with:');
console.log('   node scripts/test-db-connection.mjs\n');

// Offer to open SQL file in default editor
console.log('💡 Tip: Opening prepared SQL file for review...\n');
try {
  if (process.platform === 'darwin') {
    execSync(`open -a "TextEdit" "${preparedSqlFile}"`, { stdio: 'ignore' });
    console.log('✅ SQL file opened in TextEdit');
  } else if (process.platform === 'linux') {
    execSync(`xdg-open "${preparedSqlFile}"`, { stdio: 'ignore' });
    console.log('✅ SQL file opened in default editor');
  }
} catch (error) {
  console.log('⚠️  Could not open file automatically');
  console.log(`   Please open manually: ${preparedSqlFile}\n`);
}

console.log('\n📝 Summary:');
console.log('   ✅ Backup prepared and ready for restore');
console.log('   📋 Use Supabase Dashboard SQL Editor (Option 1) for safest restore');
console.log('   🔍 Verify after restore with test-db-connection.mjs\n');
