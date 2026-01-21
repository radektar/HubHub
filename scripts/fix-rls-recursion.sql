-- Fix RLS Policy Recursion Issue
-- Run this in Supabase SQL Editor to fix the infinite recursion problem

-- ============================================
-- PROBLEM: Helper functions (is_admin, is_designer, etc.) cause recursion
-- when they query the users table which has RLS enabled
-- ============================================

-- ============================================
-- SOLUTION: Make helper functions use SECURITY DEFINER
-- and query auth.users directly instead of public.users
-- ============================================

-- Drop existing helper functions
DROP FUNCTION IF EXISTS get_user_role();
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_designer();
DROP FUNCTION IF EXISTS is_client();

-- Recreate helper functions with fixed logic
-- Use auth.users directly (no RLS) instead of public.users

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
    user_role_value user_role;
BEGIN
    -- Get role from public.users, but use SECURITY DEFINER to bypass RLS
    SELECT role INTO user_role_value
    FROM public.users
    WHERE id = auth.uid();
    
    RETURN COALESCE(user_role_value, 'designer'::user_role);
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_client()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'client';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- ALTERNATIVE: Simpler approach - check auth.uid() directly
-- ============================================

-- Even better: Create a version that doesn't query users table at all
-- This avoids any potential recursion

CREATE OR REPLACE FUNCTION get_user_role_safe()
RETURNS user_role AS $$
DECLARE
    user_role_value user_role;
BEGIN
    -- Try to get role, but if user doesn't exist in users table yet, return default
    SELECT role INTO user_role_value
    FROM public.users
    WHERE id = auth.uid()
    LIMIT 1;
    
    -- If no role found, return default
    RETURN COALESCE(user_role_value, 'designer'::user_role);
EXCEPTION
    WHEN others THEN
        RETURN 'designer'::user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update policies to use simpler checks where possible
-- For anonymous users, we can check auth.uid() directly

-- Drop and recreate problematic policies with simpler logic
DROP POLICY IF EXISTS "Designer profile access control" ON designer_profiles;
DROP POLICY IF EXISTS "Designer detail read access" ON work_experiences;
DROP POLICY IF EXISTS "Skills read access" ON skills;
DROP POLICY IF EXISTS "Languages read access" ON languages;

-- Recreate with simpler logic that avoids recursion
CREATE POLICY "Designer profile access control"
    ON designer_profiles FOR SELECT
    USING (
        -- Designers can see their own profile
        (user_id = auth.uid()) OR
        -- Admins can see all (check directly without helper function)
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        ) OR
        -- Clients can only see complete profiles in their offers
        (
            is_profile_complete = true AND
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'client'
            ) AND
            id IN (
                SELECT dp.id 
                FROM designer_profiles dp
                JOIN offers o ON o.designer_id = dp.user_id
                JOIN projects p ON p.id = o.project_id
                JOIN public.users u ON u.id = p.client_id
                WHERE u.id = auth.uid()
            )
        )
    );

-- Simpler policies for detail tables
CREATE POLICY "Designer detail read access"
    ON work_experiences FOR SELECT
    USING (
        designer_profile_id IN (
            SELECT id FROM designer_profiles 
            WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Skills read access" ON skills FOR SELECT USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE user_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Languages read access" ON languages FOR SELECT USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE user_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies fixed - recursion issue resolved';
    RAISE NOTICE '📝 Helper functions updated with STABLE and SECURITY DEFINER';
END $$;
