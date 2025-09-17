-- SIMPLE DEBUG - One query at a time
-- Run each of these separately to see what works

-- Test 1: Basic table check
SELECT 'Test 1: Checking if users table exists' as test;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
) as users_table_exists;
