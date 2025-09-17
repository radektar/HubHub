-- OPTIMIZED HUBHUB DATABASE SETUP
-- This script creates a simplified, working database that supports all CV parsing features
-- without the complex interdependency issues of the previous schema
-- 
-- Key improvements:
-- ✅ No circular dependencies - Clear parent-child relationships  
-- ✅ Supports all CV parsing data from ParsedCVData types
-- ✅ Simplified RLS policies - Permissive initially, tighten later
-- ✅ JSONB for flexible data - Survey data, raw CV data, parsing metadata
-- ✅ MVP field requirements - All required fields directly supported

-- =============================================
-- 1. CLEAN SLATE - Remove all existing problematic structures
-- =============================================

-- Drop all tables in correct order (children first, parents last)
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS client_projects CASCADE;
DROP TABLE IF EXISTS update_requests CASCADE;
DROP TABLE IF EXISTS volunteer_experiences CASCADE;
DROP TABLE IF EXISTS professional_references CASCADE;
DROP TABLE IF EXISTS publications CASCADE;
DROP TABLE IF EXISTS awards_honors CASCADE;
DROP TABLE IF EXISTS cv_projects CASCADE;
DROP TABLE IF EXISTS certifications CASCADE;
DROP TABLE IF EXISTS languages CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS educations CASCADE;
DROP TABLE IF EXISTS education CASCADE;
DROP TABLE IF EXISTS work_experiences CASCADE;
DROP TABLE IF EXISTS designer_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop all problematic custom types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_role_enum CASCADE;
DROP TYPE IF EXISTS availability_status_enum CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS offer_status CASCADE;
DROP TYPE IF EXISTS update_request_status CASCADE;
DROP TYPE IF EXISTS skill_category CASCADE;

-- Drop all problematic functions and triggers
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_designer() CASCADE;
DROP FUNCTION IF EXISTS is_client() CASCADE;
DROP FUNCTION IF EXISTS check_profile_completion(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_profile_completion() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =============================================
-- 2. CREATE SIMPLE, WORKING TYPES
-- =============================================

CREATE TYPE user_role AS ENUM ('designer', 'client', 'admin');

-- =============================================
-- 3. CORE AUTHENTICATION TABLE (Simple, no circular dependencies)
-- =============================================

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'designer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. DESIGNER PROFILES (Main entity with all CV parsing fields)
-- =============================================

CREATE TABLE public.designer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Personal Information (from ParsedCVData.personal)
    name TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    professional_summary TEXT,
    cv_file_url TEXT,
    photo_url TEXT,
    
    -- MVP Required Fields (from TECHNICAL_APPROACH.md)
    title TEXT, -- Professional title (UX Designer, UI Designer, etc.)
    availability TEXT DEFAULT 'Available' CHECK (availability IN ('Available', 'Busy', 'Not Available')),
    total_experience_years DECIMAL(3,1) DEFAULT 0, -- Supports 0.5 increments like existing ParsingResults
    
    -- Profile Status
    is_profile_complete BOOLEAN DEFAULT FALSE,
    completion_percentage INTEGER DEFAULT 0,
    
    -- Flexible Data Storage (JSONB for complex/variable data)
    raw_cv_data JSONB, -- Complete ParsedCVData for backup/reference
    parsing_metadata JSONB, -- Confidence, errors, processing info
    survey_data JSONB, -- Survey responses from tally.so integration
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. WORK EXPERIENCES (Normalized for searchability)
-- =============================================

CREATE TABLE public.work_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designer_profile_id UUID REFERENCES public.designer_profiles(id) ON DELETE CASCADE,
    
    -- Core Information (from ParsedCVData.workExperience)
    job_title TEXT,
    company_name TEXT, -- Required for MVP (companies worked for)
    industry TEXT, -- Required for MVP (industry experience)
    location TEXT,
    
    -- Dates
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    
    -- Details
    description TEXT,
    achievements TEXT[], -- Array of achievements from ParsedCVData
    technologies TEXT[], -- Array of technologies used from ParsedCVData
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. SKILLS (Normalized with proficiency levels)
-- =============================================

CREATE TABLE public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designer_profile_id UUID REFERENCES public.designer_profiles(id) ON DELETE CASCADE,
    
    skill_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('technical', 'design', 'tools', 'soft')), -- From ParsedCVData.skills
    proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5), -- Required for MVP (1-5 scale)
    years_experience DECIMAL(3,1),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. LANGUAGES (Simple with proficiency)
-- =============================================

CREATE TABLE public.languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designer_profile_id UUID REFERENCES public.designer_profiles(id) ON DELETE CASCADE,
    
    language_name TEXT NOT NULL, -- Required for MVP
    proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5), -- Required for MVP (1-5 scale)
    is_native BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. EDUCATION (Flexible JSONB for variable data)
-- =============================================

CREATE TABLE public.education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designer_profile_id UUID REFERENCES public.designer_profiles(id) ON DELETE CASCADE,
    
    -- Core fields (from ParsedCVData.education)
    institution_name TEXT,
    degree_type TEXT,
    field_of_study TEXT,
    start_date DATE,
    end_date DATE,
    gpa TEXT,
    
    -- Flexible fields as JSONB (honors, coursework, etc.)
    additional_info JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 9. CERTIFICATIONS (Optional - from ParsedCVData.certifications)
-- =============================================

CREATE TABLE public.certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designer_profile_id UUID REFERENCES public.designer_profiles(id) ON DELETE CASCADE,
    
    certification_name TEXT NOT NULL,
    issuing_organization TEXT,
    issue_date DATE,
    expiration_date DATE,
    credential_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 10. CV PROJECTS (From parsed CV data)
-- =============================================

CREATE TABLE public.cv_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designer_profile_id UUID REFERENCES public.designer_profiles(id) ON DELETE CASCADE,
    
    project_name TEXT NOT NULL,
    description TEXT,
    role TEXT,
    duration_months INTEGER,
    technologies TEXT[], -- From ParsedCVData.projects.technologies
    project_url TEXT,
    
    -- Flexible outcomes as JSONB
    outcomes JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 11. CLIENT PROJECTS (Separate domain - for future use)
-- =============================================

CREATE TABLE public.client_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    description TEXT,
    requirements JSONB,
    budget_range TEXT,
    timeline TEXT,
    status TEXT DEFAULT 'open',
    
    -- Admin-selected candidates
    selected_candidates UUID[], -- Array of designer_profile_id
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 12. OFFERS (Bridge table for project-designer matching)
-- =============================================

CREATE TABLE public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.client_projects(id) ON DELETE CASCADE,
    designer_profile_id UUID REFERENCES public.designer_profiles(id) ON DELETE CASCADE,
    
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'viewed', 'accepted', 'declined')),
    message TEXT,
    
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

-- =============================================
-- 13. SIMPLE UPDATE TRIGGERS (No complex RLS functions)
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to main tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_designer_profiles_updated_at BEFORE UPDATE ON public.designer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_experiences_updated_at BEFORE UPDATE ON public.work_experiences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON public.skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_languages_updated_at BEFORE UPDATE ON public.languages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_education_updated_at BEFORE UPDATE ON public.education FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON public.certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cv_projects_updated_at BEFORE UPDATE ON public.cv_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_projects_updated_at BEFORE UPDATE ON public.client_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 14. SIMPLIFIED RLS POLICIES (Start permissive, tighten later)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Simple policies (users own their data)
CREATE POLICY "users_own_data" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "profiles_own_data" ON public.designer_profiles FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "skills_own_data" ON public.skills FOR ALL USING (
  auth.uid() = (SELECT user_id FROM public.designer_profiles WHERE id = designer_profile_id)
);

CREATE POLICY "experience_own_data" ON public.work_experiences FOR ALL USING (
  auth.uid() = (SELECT user_id FROM public.designer_profiles WHERE id = designer_profile_id)
);

CREATE POLICY "languages_own_data" ON public.languages FOR ALL USING (
  auth.uid() = (SELECT user_id FROM public.designer_profiles WHERE id = designer_profile_id)
);

CREATE POLICY "education_own_data" ON public.education FOR ALL USING (
  auth.uid() = (SELECT user_id FROM public.designer_profiles WHERE id = designer_profile_id)
);

CREATE POLICY "certifications_own_data" ON public.certifications FOR ALL USING (
  auth.uid() = (SELECT user_id FROM public.designer_profiles WHERE id = designer_profile_id)
);

CREATE POLICY "cv_projects_own_data" ON public.cv_projects FOR ALL USING (
  auth.uid() = (SELECT user_id FROM public.designer_profiles WHERE id = designer_profile_id)
);

CREATE POLICY "client_projects_own_data" ON public.client_projects FOR ALL USING (auth.uid() = client_id);

CREATE POLICY "offers_relevant_data" ON public.offers FOR ALL USING (
  auth.uid() = (SELECT client_id FROM public.client_projects WHERE id = project_id) OR
  auth.uid() = (SELECT user_id FROM public.designer_profiles WHERE id = designer_profile_id)
);

-- Admin can view all designer profiles (for admin matching functionality)
CREATE POLICY "admin_view_all_profiles" ON public.designer_profiles FOR SELECT USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- =============================================
-- 15. SUCCESS MESSAGE
-- =============================================

SELECT 'Optimized HubHub database setup complete! ✅' as status;
SELECT 'Key improvements implemented:' as improvements;
SELECT '✅ No circular dependencies - Clear parent-child relationships' as improvement_1;
SELECT '✅ Supports all CV parsing data from ParsedCVData types' as improvement_2;
SELECT '✅ Simplified RLS policies - Users own their data' as improvement_3;
SELECT '✅ JSONB for flexible data - Survey, raw CV, parsing metadata' as improvement_4;
SELECT '✅ MVP field support - All required fields directly supported' as improvement_5;
SELECT '✅ Compatible with existing ParsingResults component' as improvement_6;

-- Next steps:
-- 1. Run this script in your Supabase SQL Editor
-- 2. Test basic authentication (register → login)
-- 3. Test CV upload and parsing with new schema
-- 4. Verify profile completion workflow works
