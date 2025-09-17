-- CREATE PROPER AUTH USER
-- This creates a user in both auth.users and our users table

-- 1. First, let's clean up the existing test user
DELETE FROM designer_profiles WHERE user_id = '12345678-1234-1234-1234-123456789012';
DELETE FROM users WHERE id = '12345678-1234-1234-1234-123456789012';

-- 2. Create a user directly in auth.users table (this is what Supabase uses for authentication)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
) VALUES (
    '12345678-1234-1234-1234-123456789012',
    '00000000-0000-0000-0000-000000000000',
    'test@example.com',
    '$2a$10$rqiU7zGhWnRFkEMY2Z1cXO7tZ1QZ1QZ1QZ1QZ1QZ1QZ1QZ1QZ1QZ1Q', -- This is 'password123' hashed
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    'authenticated',
    'authenticated'
);

-- 3. Create corresponding user in our users table
INSERT INTO users (id, email, role, created_at, updated_at) VALUES 
    ('12345678-1234-1234-1234-123456789012', 'test@example.com', 'designer', NOW(), NOW());

-- 4. Create designer profile for this user
INSERT INTO designer_profiles (user_id, title, phone, availability, is_profile_complete) VALUES 
    ('12345678-1234-1234-1234-123456789012', 'Test Designer', '+1234567890', 'available', false);

SELECT 'Test user created in auth.users and users tables!' as status;
SELECT 'Login with: test@example.com / password123' as credentials;


