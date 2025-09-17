-- STEP 3: Check if trigger function and trigger exist

-- Check trigger function
SELECT 
  routine_name, 
  security_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- Check trigger
SELECT 
  trigger_name, 
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
