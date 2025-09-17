-- STEP 2: Check public.users table
-- This should be empty (confirming the problem)

SELECT 
  id, 
  email, 
  role, 
  created_at 
FROM public.users 
ORDER BY created_at DESC;
