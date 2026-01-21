-- Fix User Registration Trigger
-- This fixes the trigger to properly create user records with role from metadata

-- ============================================
-- STEP 1: Drop and recreate trigger function
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create improved trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert new user profile with data from auth.users
    -- SECURITY DEFINER allows bypassing RLS policies
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        -- Get role from user metadata, default to 'designer'
        COALESCE(
            (NEW.raw_user_meta_data->>'role')::user_role,
            'designer'::user_role
        ),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = NEW.email,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log error but don't fail the auth process
        RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 2: Create trigger on auth.users
-- ============================================

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 3: Verify trigger exists
-- ============================================

SELECT 
    'Trigger Function' as check_type,
    EXISTS(
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'handle_new_user' 
        AND routine_schema = 'public'
    ) as exists;

SELECT 
    'Trigger' as check_type,
    EXISTS(
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
        AND event_object_schema = 'auth'
    ) as exists;

-- ============================================
-- STEP 4: Test the trigger (optional - creates a test user)
-- ============================================
-- Uncomment to test:
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
-- VALUES (
--     gen_random_uuid(),
--     'test-trigger@example.com',
--     crypt('test123', gen_salt('bf')),
--     NOW(),
--     NOW(),
--     NOW(),
--     '{"role": "designer"}'::jsonb
-- );

-- ============================================
-- COMPLETION
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ User registration trigger fixed!';
    RAISE NOTICE '📝 Trigger will automatically create user records';
    RAISE NOTICE '🔒 Uses SECURITY DEFINER to bypass RLS';
    RAISE NOTICE '💡 Role is read from user metadata (raw_user_meta_data->>role)';
END $$;
