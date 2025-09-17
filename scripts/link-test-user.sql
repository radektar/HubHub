-- Link the auth user to our users table
-- Run this in Supabase SQL Editor after creating the auth user

-- Insert the user into our users table
INSERT INTO users (id, email, role) 
SELECT 
    au.id,
    au.email,
    'designer'::user_role
FROM auth.users au 
WHERE au.email = 'designer@hubhub.test'
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role;

-- Verify the user was created
SELECT 
    u.id,
    u.email, 
    u.role,
    au.email_confirmed_at IS NOT NULL as email_confirmed
FROM users u 
JOIN auth.users au ON u.id = au.id 
WHERE u.email = 'designer@hubhub.test';


