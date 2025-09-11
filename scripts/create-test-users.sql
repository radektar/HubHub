-- Test Users Setup for HubHub
-- This script creates test users for each role to facilitate testing

-- Note: These users need to be created through Supabase Auth first, 
-- then this script adds their roles to the users table

-- Test Designer User
-- Email: designer@test.com
-- Password: TestPass123!
-- Role: designer

-- Test Client User  
-- Email: client@test.com
-- Password: TestPass123!
-- Role: client

-- Test Admin User
-- Email: admin@test.com  
-- Password: TestPass123!
-- Role: admin

-- After creating users through auth, run these inserts:
-- (Replace the UUIDs with actual user IDs from auth.users)

-- Example inserts (update with real UUIDs after auth signup):
/*
INSERT INTO users (id, email, role, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000000001', 'designer@test.com', 'designer', NOW(), NOW()),
('00000000-0000-0000-0000-000000000002', 'client@test.com', 'client', NOW(), NOW()),
('00000000-0000-0000-0000-000000000003', 'admin@test.com', 'admin', NOW(), NOW());
*/

-- Test Designer Profile (create after designer user exists)
/*
INSERT INTO designer_profiles (
  user_id, 
  name, 
  title, 
  phone, 
  email, 
  availability, 
  portfolio_url, 
  cv_file_url, 
  professional_summary, 
  total_experience_years,
  is_profile_complete
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Designer',
  'UX/UI Designer', 
  '+1-555-0123',
  'designer@test.com',
  'Available',
  'https://portfolio.test.com',
  'https://cv.test.com/designer-cv.pdf',
  'Experienced UX/UI designer with 5+ years in digital product design.',
  5,
  true
);
*/

