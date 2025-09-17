-- QUICK DEBUG - Check current database state
-- Run this in Supabase SQL Editor to see what exists

-- Check what tables exist
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if users table exists and its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if any triggers exist
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Check if handle_new_user function exists
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' AND routine_schema = 'public';

SELECT 'Database debug complete - check results above' as status;
