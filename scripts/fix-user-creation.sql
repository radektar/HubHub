-- Fix user creation by temporarily disabling RLS or using service role
-- Run this in Supabase SQL Editor

-- Option 1: Check what auth users exist first
SELECT 'Existing auth users:' as info;
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- Option 2: Temporarily disable RLS to insert users (ADMIN ONLY)
-- WARNING: Only run this if you're using service role key
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Insert any auth users that don't exist in users table
INSERT INTO users (id, email, role) 
SELECT 
    au.id,
    au.email,
    'designer'::user_role
FROM auth.users au 
WHERE au.id NOT IN (SELECT id FROM users)
ON CONFLICT (id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Option 3: Create a function that can bypass RLS (better approach)
CREATE OR REPLACE FUNCTION create_user_profile(user_id UUID, user_email TEXT, user_role user_role)
RETURNS VOID AS $$
BEGIN
    INSERT INTO users (id, email, role) 
    VALUES (user_id, user_email, user_role)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Use the function to create users from auth.users
SELECT create_user_profile(au.id, au.email, 'designer'::user_role)
FROM auth.users au 
WHERE au.email LIKE '%@%';

-- Verify users were created
SELECT 'Users table after fix:' as info;
SELECT u.email, u.role, au.email_confirmed_at IS NOT NULL as confirmed
FROM users u 
JOIN auth.users au ON u.id = au.id 
ORDER BY u.created_at DESC;


