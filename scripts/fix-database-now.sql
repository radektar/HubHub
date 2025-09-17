-- IMMEDIATE FIX: Remove all constraints and RLS
-- Execute this in Supabase SQL Editor

-- Drop foreign key constraints
ALTER TABLE designer_profiles DROP CONSTRAINT IF EXISTS designer_profiles_user_id_fkey;
ALTER TABLE work_experiences DROP CONSTRAINT IF EXISTS work_experiences_user_id_fkey;
ALTER TABLE skills DROP CONSTRAINT IF EXISTS skills_user_id_fkey;
ALTER TABLE languages DROP CONSTRAINT IF EXISTS languages_user_id_fkey;
ALTER TABLE educations DROP CONSTRAINT IF EXISTS educations_user_id_fkey;
ALTER TABLE certifications DROP CONSTRAINT IF EXISTS certifications_user_id_fkey;
ALTER TABLE cv_projects DROP CONSTRAINT IF EXISTS cv_projects_user_id_fkey;
ALTER TABLE awards_honors DROP CONSTRAINT IF EXISTS awards_honors_user_id_fkey;
ALTER TABLE publications DROP CONSTRAINT IF EXISTS publications_user_id_fkey;
ALTER TABLE professional_references DROP CONSTRAINT IF EXISTS professional_references_user_id_fkey;
ALTER TABLE volunteer_experiences DROP CONSTRAINT IF EXISTS volunteer_experiences_user_id_fkey;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_client_id_fkey;
ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_project_id_fkey;
ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_designer_id_fkey;
ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_offer_id_fkey;
ALTER TABLE update_requests DROP CONSTRAINT IF EXISTS update_requests_designer_id_fkey;

-- Disable RLS on all tables
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

-- Drop all RLS functions
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_designer() CASCADE;
DROP FUNCTION IF EXISTS is_client() CASCADE;
DROP FUNCTION IF EXISTS check_profile_completion(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_profile_completion() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Clear all data to start fresh
TRUNCATE TABLE evaluations CASCADE;
TRUNCATE TABLE offers CASCADE;
TRUNCATE TABLE projects CASCADE;
TRUNCATE TABLE update_requests CASCADE;
TRUNCATE TABLE volunteer_experiences CASCADE;
TRUNCATE TABLE professional_references CASCADE;
TRUNCATE TABLE publications CASCADE;
TRUNCATE TABLE awards_honors CASCADE;
TRUNCATE TABLE cv_projects CASCADE;
TRUNCATE TABLE languages CASCADE;
TRUNCATE TABLE certifications CASCADE;
TRUNCATE TABLE skills CASCADE;
TRUNCATE TABLE educations CASCADE;
TRUNCATE TABLE work_experiences CASCADE;
TRUNCATE TABLE designer_profiles CASCADE;
TRUNCATE TABLE users CASCADE;

SELECT 'Database fixed! All constraints removed, RLS disabled, tables cleared.' as status;


