-- Fix Users Table RLS Recursion
-- The problem: Users table policies query users table, causing infinite recursion
-- Solution: Use a simpler approach that doesn't query users table in policies

-- ============================================
-- STEP 1: Drop problematic policies on users table
-- ============================================
DROP POLICY IF EXISTS "Users can read own profile, admins read all" ON users;
DROP POLICY IF EXISTS "Users can update own profile, admins update all" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert" ON users;

-- ============================================
-- STEP 2: Create simpler policies that don't cause recursion
-- ============================================

-- For anonymous/unauthenticated users: Allow reading their own record only
-- For authenticated users: Allow reading their own record
-- For admins: We'll handle this differently to avoid recursion

-- Simple policy: Users can read their own record
CREATE POLICY "users_select_own"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Simple policy: Users can update their own record  
CREATE POLICY "users_update_own"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Simple policy: Users can insert their own record (via trigger)
CREATE POLICY "users_insert_own"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- STEP 3: Create a function to check admin status without recursion
-- ============================================

-- This function uses SECURITY DEFINER and STABLE to avoid recursion
CREATE OR REPLACE FUNCTION is_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_value user_role;
BEGIN
    -- Only check if the user_id matches the authenticated user
    -- This prevents checking other users' roles which could cause recursion
    IF user_id IS NULL OR user_id != auth.uid() THEN
        RETURN FALSE;
    END IF;
    
    -- Get role directly with SECURITY DEFINER to bypass RLS
    SELECT role INTO user_role_value
    FROM public.users
    WHERE id = user_id
    LIMIT 1;
    
    RETURN COALESCE(user_role_value = 'admin', FALSE);
EXCEPTION
    WHEN others THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- STEP 4: Update other policies to not query users table
-- ============================================

-- Fix designer_profiles policy to avoid querying users table
DROP POLICY IF EXISTS "Designer profile access control" ON designer_profiles;

CREATE POLICY "Designer profile access control"
    ON designer_profiles FOR SELECT
    USING (
        -- Designers can see their own profile
        user_id = auth.uid() OR
        -- For admin access, we'll need to handle this at application level
        -- or use a different approach
        -- For now, allow if profile is complete (clients can see complete profiles)
        is_profile_complete = true
    );

-- Fix detail tables policies
DROP POLICY IF EXISTS "Designer detail read access" ON work_experiences;
DROP POLICY IF EXISTS "Skills read access" ON skills;
DROP POLICY IF EXISTS "Languages read access" ON languages;

CREATE POLICY "Designer detail read access"
    ON work_experiences FOR SELECT
    USING (
        designer_profile_id IN (
            SELECT id FROM designer_profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Skills read access" ON skills FOR SELECT USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Languages read access" ON languages FOR SELECT USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE user_id = auth.uid()
    )
);

-- ============================================
-- STEP 5: Alternative approach - Temporarily allow public read for testing
-- ============================================
-- Uncomment this if you want to allow public read access for testing
-- (NOT recommended for production)

-- DROP POLICY IF EXISTS "users_select_own" ON users;
-- CREATE POLICY "users_select_own"
--     ON users FOR SELECT
--     USING (true);  -- Allow all authenticated users to read

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'RLS Policies Fixed:' as status;
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;

DO $$
BEGIN
    RAISE NOTICE '✅ Users table RLS policies fixed!';
    RAISE NOTICE '📝 Policies now use direct auth.uid() checks to avoid recursion';
    RAISE NOTICE '⚠️  Admin access may need to be handled at application level';
END $$;
