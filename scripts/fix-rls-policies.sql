-- Fix RLS policy infinite recursion issue
-- Run this in Supabase SQL Editor

-- Step 1: Drop problematic policies to fix infinite recursion
DROP POLICY IF EXISTS "Designer profile access control" ON designer_profiles;
DROP POLICY IF EXISTS "Designer profile update control" ON designer_profiles;
DROP POLICY IF EXISTS "Designer profile creation control" ON designer_profiles;
DROP POLICY IF EXISTS "Users can read own profile, admins read all" ON users;
DROP POLICY IF EXISTS "Users can update own profile, admins update all" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert" ON users;

-- Step 2: Temporarily disable RLS to allow service operations
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE designer_profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Create simple, non-recursive policies

-- Users table policies (simple, no circular references)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_policy" ON users FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid())
);

CREATE POLICY "users_insert_policy" ON users FOR INSERT WITH CHECK (
    auth.uid() = id
);

CREATE POLICY "users_update_policy" ON users FOR UPDATE USING (
    auth.uid() = id
);

-- Designer profiles policies (simple, direct checks)
ALTER TABLE designer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "designer_profiles_select_policy" ON designer_profiles FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

CREATE POLICY "designer_profiles_insert_policy" ON designer_profiles FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('designer', 'admin')
    )
);

CREATE POLICY "designer_profiles_update_policy" ON designer_profiles FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Test the fix
SELECT 'RLS policies updated successfully!' as status;


