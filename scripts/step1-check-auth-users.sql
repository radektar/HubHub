-- STEP 1: Check auth.users table
-- Run this first to see the actual auth users

SELECT 
  id, 
  email, 
  created_at,
  raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC;
