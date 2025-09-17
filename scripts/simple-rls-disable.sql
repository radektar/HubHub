-- Simple fix: Just disable RLS completely for testing
-- This bypasses all the policy issues

-- Drop ALL policies first (to avoid dependency errors)
DROP POLICY IF EXISTS "Designer detail read access" ON work_experiences;
DROP POLICY IF EXISTS "Designer detail write access" ON work_experiences;
DROP POLICY IF EXISTS "Skills read access" ON skills;
DROP POLICY IF EXISTS "Skills write access" ON skills;
DROP POLICY IF EXISTS "Languages read access" ON languages;
DROP POLICY IF EXISTS "Languages write access" ON languages;
DROP POLICY IF EXISTS "Educations read access" ON educations;
DROP POLICY IF EXISTS "Educations write access" ON educations;
DROP POLICY IF EXISTS "Certifications read access" ON certifications;
DROP POLICY IF EXISTS "Certifications write access" ON certifications;
DROP POLICY IF EXISTS "CV Projects read access" ON cv_projects;
DROP POLICY IF EXISTS "CV Projects write access" ON cv_projects;
DROP POLICY IF EXISTS "Awards read access" ON awards_honors;
DROP POLICY IF EXISTS "Awards write access" ON awards_honors;
DROP POLICY IF EXISTS "Publications read access" ON publications;
DROP POLICY IF EXISTS "Publications write access" ON publications;
DROP POLICY IF EXISTS "References read access" ON professional_references;
DROP POLICY IF EXISTS "References write access" ON professional_references;
DROP POLICY IF EXISTS "Volunteer read access" ON volunteer_experiences;
DROP POLICY IF EXISTS "Volunteer write access" ON volunteer_experiences;
DROP POLICY IF EXISTS "Project access control" ON projects;
DROP POLICY IF EXISTS "Project update control" ON projects;
DROP POLICY IF EXISTS "Project creation control" ON projects;
DROP POLICY IF EXISTS "Offer read access" ON offers;
DROP POLICY IF EXISTS "Offer write access" ON offers;
DROP POLICY IF EXISTS "Designer offer response" ON offers;
DROP POLICY IF EXISTS "Evaluation read access" ON evaluations;
DROP POLICY IF EXISTS "Evaluation creation control" ON evaluations;
DROP POLICY IF EXISTS "Update request read access" ON update_requests;
DROP POLICY IF EXISTS "Update request write access" ON update_requests;
DROP POLICY IF EXISTS "Update request status control" ON update_requests;
DROP POLICY IF EXISTS "Designer profile access control" ON designer_profiles;
DROP POLICY IF EXISTS "Designer profile update control" ON designer_profiles;
DROP POLICY IF EXISTS "Designer profile creation control" ON designer_profiles;
DROP POLICY IF EXISTS "Users can read own profile, admins read all" ON users;
DROP POLICY IF EXISTS "Users can update own profile, admins update all" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert" ON users;

-- Drop functions that cause recursion
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_designer() CASCADE;
DROP FUNCTION IF EXISTS is_client() CASCADE;

-- Disable RLS on ALL tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE designer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_experiences DISABLE ROW LEVEL SECURITY;
ALTER TABLE educations DISABLE ROW LEVEL SECURITY;
ALTER TABLE skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE certifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE languages DISABLE ROW LEVEL SECURITY;
ALTER TABLE cv_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE awards_honors DISABLE ROW LEVEL SECURITY;
ALTER TABLE publications DISABLE ROW LEVEL SECURITY;
ALTER TABLE professional_references DISABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_experiences DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE update_requests DISABLE ROW LEVEL SECURITY;

-- Show current auth users (if any exist)
SELECT 'Current auth users:' as info;
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Show current users table
SELECT 'Current users table:' as info;
SELECT id, email, role, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'RLS DISABLED SUCCESSFULLY! Registration should now work.' as final_status;


