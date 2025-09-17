-- Debug user creation issues
-- Run each section separately in Supabase SQL Editor

-- 1. Check if ANY auth users exist
SELECT 'Auth Users:' as section;
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check if our users table exists and is accessible
SELECT 'Users Table:' as section;
SELECT COUNT(*) as total_users FROM users;

-- 3. Check RLS policies on users table
SELECT 'RLS Status:' as section;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- 4. Try to see RLS policies
SELECT 'RLS Policies:' as section;
SELECT pol.policyname, pol.permissive, pol.roles, pol.cmd, pol.qual 
FROM pg_policy pol 
JOIN pg_class pc ON pol.polrelid = pc.oid 
WHERE pc.relname = 'users';

-- 5. Check if we can insert directly (this might fail due to RLS)
-- Uncomment the next line to test direct insert
-- INSERT INTO users (id, email, role) VALUES (gen_random_uuid(), 'test@example.com', 'designer');

-- 6. Try to insert with service role (bypass RLS)
-- This should work if run with service role key
INSERT INTO users (id, email, role) VALUES (gen_random_uuid(), 'manual-test@example.com', 'designer'::user_role);

-- 7. Check if the manual insert worked
SELECT 'After Manual Insert:' as section;
SELECT id, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 3;
