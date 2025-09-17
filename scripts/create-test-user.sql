-- Create test designer user
-- Run this in Supabase SQL Editor if the test user doesn't exist

-- First, check if user exists
SELECT id, email, role FROM users WHERE email = 'designer@hubhub.test';

-- If no user found, you'll need to:
-- 1. Go to Authentication > Users in Supabase Dashboard
-- 2. Click "Add user"  
-- 3. Email: designer@hubhub.test
-- 4. Password: TestDesigner123!
-- 5. Email Confirm: Yes

-- Then run this to add to users table:
INSERT INTO users (id, email, role) 
SELECT 
    id,
    'designer@hubhub.test',
    'designer'::user_role
FROM auth.users 
WHERE email = 'designer@hubhub.test'
ON CONFLICT (id) DO NOTHING;

-- Verify user was created
SELECT u.email, u.role, au.email_confirmed_at
FROM users u 
JOIN auth.users au ON u.id = au.id 
WHERE u.email = 'designer@hubhub.test';


