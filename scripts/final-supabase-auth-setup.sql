-- FINAL SUPABASE AUTH SETUP - DEFINITIVE VERSION
-- This is the ONLY script you need to run for Supabase authentication
-- Combines the best features from both previous scripts with fixes

-- =============================================
-- 1. CREATE SECURE TRIGGER FUNCTION
-- =============================================

-- This function automatically creates a user profile when a new auth user is created
-- SECURITY DEFINER allows it to bypass RLS policies
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user profile with data from auth.users
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'designer')::user_role, -- Fixed: Added proper type casting
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 2. CREATE TRIGGER ON AUTH.USERS
-- =============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires after new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 3. SETUP RLS POLICIES (OPTIONAL - ENABLE IF NEEDED)
-- =============================================

-- Enable RLS on users table (uncomment if you want RLS enabled)
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "users_own_data" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;

-- Create proper RLS policies (only if RLS is enabled above)
-- Uncomment these if you enabled RLS above:

-- CREATE POLICY "Users can view own profile" ON public.users
--   FOR SELECT USING (auth.uid() = id);

-- CREATE POLICY "Users can update own profile" ON public.users
--   FOR UPDATE USING (auth.uid() = id);

-- CREATE POLICY "Admins can view all profiles" ON public.users
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM public.users 
--       WHERE id = auth.uid() AND role = 'admin'
--     )
--   );

-- =============================================
-- 4. VERIFY SETUP
-- =============================================

-- Check if trigger function exists
SELECT 
  routine_name,
  routine_type,
  security_type,
  'Function created successfully' as status
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  'Trigger created successfully' as status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN 'RLS is enabled' ELSE 'RLS is disabled (good for development)' END as rls_status
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Final success messages
SELECT '🎉 FINAL Supabase authentication setup complete!' as status;
SELECT '✅ Trigger function created with proper type casting' as step_1;
SELECT '✅ Trigger created on auth.users table' as step_2;
SELECT '✅ RLS policies cleaned up (disabled for development)' as step_3;
SELECT '🧪 TEST: Sign up a new user and check public.users table' as next_step;

-- =============================================
-- 5. TESTING INSTRUCTIONS
-- =============================================

/*
TESTING INSTRUCTIONS:

1. Run this script in Supabase SQL Editor
2. Go to your app at http://localhost:3002/auth/register
3. Sign up with: email@test.com, password: test123, role: designer
4. Check Supabase Dashboard → Table Editor → users table
5. You should see the new user record automatically created

If it works, you'll see:
- User in auth.users (managed by Supabase)
- User in public.users (created by our trigger)
- Both have the same ID and email
*/
