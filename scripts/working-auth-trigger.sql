-- WORKING AUTH TRIGGER - Simplified and tested
-- This creates the trigger function and trigger to automatically create user profiles

-- 1. Create the trigger function (with better error handling)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user profile with data from auth.users
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'designer')::user_role,
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the auth process
  RAISE WARNING 'Failed to create user profile: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Verify the setup worked
SELECT 'Trigger function created:' as status, 
       EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user') as function_exists;

SELECT 'Trigger created:' as status,
       EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') as trigger_exists;

SELECT '✅ Auth trigger setup complete!' as final_status;
