-- Test manual user insertion to check permissions
-- Run this in Supabase SQL Editor to test database access

-- Test 1: Try to insert a user manually
INSERT INTO public.users (id, email, role, created_at, updated_at) 
VALUES (
  gen_random_uuid(), 
  'manual-test@example.com', 
  'designer', 
  NOW(), 
  NOW()
);

-- Test 2: Check if the insert worked
SELECT 'Manual insert test:' as test;
SELECT id, email, role, created_at 
FROM public.users 
WHERE email = 'manual-test@example.com';

-- Test 3: Check table structure
SELECT 'Users table structure:' as test;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
