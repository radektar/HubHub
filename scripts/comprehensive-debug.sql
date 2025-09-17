-- COMPREHENSIVE DEBUG - Find out why users aren't syncing
-- Run this in Supabase SQL Editor

-- 1. Check auth.users (should have data)
SELECT 'AUTH USERS (should have 2 records):' as debug_step;
SELECT id, email, created_at, raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Check public.users (probably empty)
SELECT 'PUBLIC USERS (probably empty):' as debug_step;
SELECT id, email, role, created_at 
FROM public.users 
ORDER BY created_at DESC;

-- 3. Test manual insert with exact auth.users data
SELECT 'MANUAL INSERT TEST:' as debug_step;
INSERT INTO public.users (id, email, role, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'role', 'designer')::user_role,
  created_at,
  NOW()
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.users WHERE id IS NOT NULL)
LIMIT 1;

-- 4. Check if insert worked
SELECT 'AFTER MANUAL INSERT:' as debug_step;
SELECT id, email, role, created_at 
FROM public.users 
ORDER BY created_at DESC;

-- 5. Check trigger function exists
SELECT 'TRIGGER FUNCTION CHECK:' as debug_step;
SELECT routine_name, security_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' AND routine_schema = 'public';

-- 6. Check trigger exists
SELECT 'TRIGGER CHECK:' as debug_step;
SELECT trigger_name, event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 7. Check table permissions
SELECT 'TABLE PERMISSIONS:' as debug_step;
SELECT grantee, privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'users' AND table_schema = 'public';

SELECT 'DEBUG COMPLETE - Review all sections above' as final_status;
