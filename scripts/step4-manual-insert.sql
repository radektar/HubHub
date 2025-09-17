-- STEP 4: Manual insert test
-- This will try to manually sync one user from auth.users to public.users

INSERT INTO public.users (id, email, role, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'role', 'designer')::user_role,
  created_at,
  NOW()
FROM auth.users 
WHERE id NOT IN (SELECT COALESCE(id, '') FROM public.users)
LIMIT 1;
