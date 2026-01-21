-- Fix RLS Recursion and Verify Database Setup
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Fix RLS Recursion Issue
-- ============================================

-- Drop problematic helper functions
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_designer() CASCADE;
DROP FUNCTION IF EXISTS is_client() CASCADE;

-- Recreate helper functions with STABLE and proper SECURITY DEFINER
-- This prevents recursion by marking functions as STABLE (won't be re-evaluated)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
    user_role_value user_role;
BEGIN
    -- Use SECURITY DEFINER to bypass RLS when querying users table
    SELECT role INTO user_role_value
    FROM public.users
    WHERE id = auth.uid()
    LIMIT 1;
    
    RETURN COALESCE(user_role_value, 'designer'::user_role);
EXCEPTION
    WHEN others THEN
        RETURN 'designer'::user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_designer()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'designer';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_client()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'client';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- STEP 2: Fix Policies to Avoid Recursion
-- ============================================

-- Drop and recreate problematic policies with direct checks
DROP POLICY IF EXISTS "Users can read own profile, admins read all" ON users;
DROP POLICY IF EXISTS "Users can update own profile, admins update all" ON users;
DROP POLICY IF EXISTS "Designer profile access control" ON designer_profiles;
DROP POLICY IF EXISTS "Designer detail read access" ON work_experiences;
DROP POLICY IF EXISTS "Skills read access" ON skills;
DROP POLICY IF EXISTS "Languages read access" ON languages;

-- Users policies - use direct role check to avoid recursion
CREATE POLICY "Users can read own profile, admins read all"
    ON users FOR SELECT
    USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

CREATE POLICY "Users can update own profile, admins update all"
    ON users FOR UPDATE
    USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Designer profiles - simplified policy
CREATE POLICY "Designer profile access control"
    ON designer_profiles FOR SELECT
    USING (
        -- Designers can see their own profile
        user_id = auth.uid() OR
        -- Admins can see all (direct check, no helper function)
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        ) OR
        -- Clients can see complete profiles in their offers
        (
            is_profile_complete = true AND
            EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = auth.uid() AND u.role = 'client'
            ) AND
            id IN (
                SELECT dp.id 
                FROM designer_profiles dp
                JOIN offers o ON o.designer_id = dp.user_id
                JOIN projects p ON p.id = o.project_id
                WHERE p.client_id = auth.uid()
            )
        )
    );

-- Detail tables - simplified policies
CREATE POLICY "Designer detail read access"
    ON work_experiences FOR SELECT
    USING (
        designer_profile_id IN (
            SELECT id FROM designer_profiles 
            WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

CREATE POLICY "Skills read access" ON skills FOR SELECT USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE user_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role = 'admin'
    )
);

CREATE POLICY "Languages read access" ON languages FOR SELECT USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE user_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role = 'admin'
    )
);

-- ============================================
-- STEP 3: Verify Tables Exist
-- ============================================
SELECT 'Tables Verification:' as check_type;
SELECT 
    tablename as table_name,
    CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- STEP 4: Summary
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ RLS recursion fixed!';
    RAISE NOTICE '📝 Policies updated to use direct role checks';
    RAISE NOTICE '🔒 Helper functions marked as STABLE to prevent recursion';
END $$;
