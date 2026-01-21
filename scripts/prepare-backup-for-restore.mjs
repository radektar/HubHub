#!/usr/bin/env node

/**
 * Prepare Supabase Backup for Restore
 * 
 * This script filters out system commands that may conflict with Supabase
 * and prepares a clean SQL file ready for restoration.
 * 
 * Usage:
 *   node scripts/prepare-backup-for-restore.mjs <backup-file> [output-file]
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const backupFilePath = process.argv[2];
const outputFilePath = process.argv[3] || backupFilePath.replace(/\.backup$/, '_prepared.sql');

if (!backupFilePath) {
  console.error('❌ Error: Backup file path is required');
  console.log('\nUsage: node scripts/prepare-backup-for-restore.mjs <backup-file> [output-file]');
  process.exit(1);
}

console.log('🔧 Preparing backup for Supabase restore...\n');
console.log(`   Input:  ${backupFilePath}`);
console.log(`   Output: ${outputFilePath}\n`);

try {
  const backupContent = readFileSync(backupFilePath, 'utf-8');
  const lines = backupContent.split('\n');
  
  const filteredLines = [];
  let skipSection = false;
  let inRoleSection = false;
  let inDatabaseSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip cluster-level commands
    if (trimmed.startsWith('\\restrict') || 
        trimmed.startsWith('SET default_transaction_read_only')) {
      continue;
    }
    
    // Skip role creation (roles already exist in Supabase)
    if (trimmed.match(/^CREATE ROLE\s+(anon|authenticated|authenticator|service_role|postgres|supabase_|dashboard_user|pgbouncer)/i)) {
      inRoleSection = true;
      skipSection = true;
      continue;
    }
    
    if (inRoleSection && (trimmed.startsWith('CREATE ROLE') || trimmed.startsWith('ALTER ROLE'))) {
      continue;
    }
    
    if (inRoleSection && trimmed === '') {
      inRoleSection = false;
      skipSection = false;
    }
    
    // Skip database creation
    if (trimmed.match(/^CREATE DATABASE/i) || trimmed.match(/^-- Database "/)) {
      inDatabaseSection = true;
      skipSection = true;
      continue;
    }
    
    if (inDatabaseSection && trimmed.match(/^-- PostgreSQL database dump complete/)) {
      inDatabaseSection = false;
      skipSection = false;
      continue;
    }
    
    // Skip system schema creation (auth, storage, realtime, etc.)
    if (trimmed.match(/^CREATE SCHEMA\s+(auth|storage|realtime|pgbouncer|extensions|graphql)/i)) {
      skipSection = true;
      continue;
    }
    
    if (skipSection && trimmed.match(/^ALTER SCHEMA\s+(auth|storage|realtime|pgbouncer|extensions|graphql)/i)) {
      continue;
    }
    
    if (skipSection && trimmed === '') {
      skipSection = false;
    }
    
    // Keep everything else
    if (!skipSection) {
      filteredLines.push(line);
    }
  }
  
  const filteredContent = filteredLines.join('\n');
  
  // Add header comment
  const header = `-- ============================================
-- Prepared Backup for Supabase Restore
-- Generated from: ${basename(backupFilePath)}
-- Date: ${new Date().toISOString()}
-- ============================================
-- 
-- This file has been filtered to remove:
-- - System role creation (roles already exist)
-- - Database creation commands
-- - System schema creation (auth, storage, etc.)
-- 
-- Review this file before restoring!
-- ============================================

`;
  
  writeFileSync(outputFilePath, header + filteredContent);
  
  const originalSize = (backupContent.length / 1024).toFixed(2);
  const filteredSize = (filteredContent.length / 1024).toFixed(2);
  
  console.log('✅ Backup prepared successfully!\n');
  console.log(`   Original size: ${originalSize} KB`);
  console.log(`   Filtered size: ${filteredSize} KB`);
  console.log(`   Lines removed: ${lines.length - filteredLines.length}\n`);
  console.log('📝 Next steps:');
  console.log(`   1. Review the prepared file: ${outputFilePath}`);
  console.log('   2. Open Supabase Dashboard → SQL Editor');
  console.log('   3. Copy and paste the prepared SQL');
  console.log('   4. Run the SQL commands');
  console.log('   5. Verify with: node scripts/test-db-connection.mjs\n');
  
} catch (error) {
  console.error('❌ Error preparing backup:', error.message);
  process.exit(1);
}
