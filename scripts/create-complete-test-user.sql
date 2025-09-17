-- Complete test user creation (if auth.users allows direct insert)
-- This might not work due to RLS policies, use the dashboard method above instead

-- Try to create auth user (this might fail due to RLS)
-- INSERT INTO auth.users (
--     id,
--     instance_id,
--     email,
--     encrypted_password,
--     email_confirmed_at,
--     created_at,
--     updated_at,
--     raw_app_meta_data,
--     raw_user_meta_data,
--     is_super_admin,
--     role
-- ) VALUES (
--     gen_random_uuid(),
--     '00000000-0000-0000-0000-000000000000',
--     'designer@hubhub.test',
--     crypt('TestDesigner123!', gen_salt('bf')),
--     now(),
--     now(),
--     now(),
--     '{"provider":"email","providers":["email"]}',
--     '{}',
--     false,
--     'authenticated'
-- );

-- Instead, check if we have any existing users we can use
SELECT 
    au.id,
    au.email,
    au.email_confirmed_at,
    u.role
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
ORDER BY au.created_at DESC
LIMIT 5;


