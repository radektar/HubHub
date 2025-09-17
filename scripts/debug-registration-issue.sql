-- DEBUG REGISTRATION ISSUE
-- Run this in Supabase SQL Editor to help identify the problem

-- 1. Check if tables exist and their structure
SELECT 'TABLES CHECK:' as debug_step;
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'designer_profiles', 'work_experiences', 'skills', 'languages', 'education')
ORDER BY table_name;

-- 2. Check users table structure specifically
SELECT 'USERS TABLE STRUCTURE:' as debug_step;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if trigger function exists
SELECT 'TRIGGER FUNCTION CHECK:' as debug_step;
SELECT routine_name, routine_type, security_type, routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' AND routine_schema = 'public';

-- 4. Check if trigger exists on auth.users
SELECT 'TRIGGER CHECK:' as debug_step;
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 5. Check current data in users table
SELECT 'CURRENT USERS DATA:' as debug_step;
SELECT id, email, role, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Check auth.users table (if accessible)
SELECT 'AUTH USERS CHECK:' as debug_step;
SELECT id, email, created_at, email_confirmed_at, raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Check RLS status
SELECT 'RLS STATUS:' as debug_step;
SELECT schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 8. Test the user_role enum
SELECT 'USER ROLE ENUM CHECK:' as debug_step;
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

SELECT 'DEBUG COMPLETE - Check all results above' as final_status;
