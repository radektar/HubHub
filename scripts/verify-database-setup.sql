-- Quick Verification Script for Database Setup
-- Run this in Supabase SQL Editor to verify everything was created correctly

-- ============================================
-- 1. CHECK TABLES
-- ============================================
SELECT 'Tables Created:' as check_type;
SELECT 
    tablename as table_name,
    CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- 2. CHECK CUSTOM TYPES
-- ============================================
SELECT 'Custom Types:' as check_type;
SELECT typname as type_name
FROM pg_type 
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND typname IN ('user_role', 'project_status', 'offer_status', 'update_request_status', 'skill_category')
ORDER BY typname;

-- ============================================
-- 3. CHECK FUNCTIONS
-- ============================================
SELECT 'Functions Created:' as check_type;
SELECT 
    routine_name as function_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'check_profile_completion',
    'update_profile_completion',
    'get_user_role',
    'is_admin',
    'is_designer',
    'is_client',
    'handle_new_user',
    'update_updated_at_column'
)
ORDER BY routine_name;

-- ============================================
-- 4. CHECK TRIGGERS
-- ============================================
SELECT 'Triggers Created:' as check_type;
SELECT 
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%completion%' OR trigger_name LIKE '%updated_at%' OR trigger_name LIKE '%auth%'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 5. CHECK INDEXES
-- ============================================
SELECT 'Indexes Created:' as check_type;
SELECT 
    tablename as table_name,
    indexname as index_name
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================
-- 6. CHECK RLS POLICIES
-- ============================================
SELECT 'RLS Policies:' as check_type;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 7. SUMMARY
-- ============================================
SELECT 'Summary:' as check_type;
SELECT 
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as total_tables,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') as total_functions,
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') as total_triggers;
