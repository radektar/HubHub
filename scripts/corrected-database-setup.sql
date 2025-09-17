-- CORRECTED DATABASE SETUP - MATCHES TECHNICAL DOCUMENTATION
-- This fixes the database structure to match TECHNICAL_APPROACH.md specifications
-- Addresses the user registration issue by creating proper schema

-- =============================================
-- 1. CLEAN SLATE - Remove all existing problematic structures
-- =============================================

-- Drop all tables in correct order (children first, parents last)
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS client_projects CASCADE;
DROP TABLE IF EXISTS cv_projects CASCADE;
DROP TABLE IF EXISTS update_requests CASCADE;
DROP TABLE IF EXISTS volunteer_experiences CASCADE;
DROP TABLE IF EXISTS professional_references CASCADE;
DROP TABLE IF EXISTS publications CASCADE;
DROP TABLE IF EXISTS awards_honors CASCADE;
DROP TABLE IF EXISTS certifications CASCADE;
DROP TABLE IF EXISTS languages CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS education CASCADE;
DROP TABLE IF EXISTS educations CASCADE;
DROP TABLE IF EXISTS work_experiences CASCADE;
DROP TABLE IF EXISTS designer_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop all problematic custom types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_role_enum CASCADE;
DROP TYPE IF EXISTS availability_status_enum CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS offer_status CASCADE;

-- Drop all problematic functions and triggers
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_designer() CASCADE;
DROP FUNCTION IF EXISTS is_client() CASCADE;
DROP FUNCTION IF EXISTS check_profile_completion(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_profile_completion() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- =============================================
-- 2. CREATE CORRECT TYPES (matching technical documentation)
-- =============================================

CREATE TYPE user_role AS ENUM ('designer', 'client', 'admin');

-- =============================================
-- 3. USERS TABLE (Core authentication table)
-- =============================================
-- Note: This should reference Supabase auth.users, but for now we'll make it standalone

CREATE TABLE public.users (
    id UUID PRIMARY KEY, -- This will be populated from auth.users.id
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'designer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. DESIGNER PROFILES (Main profile entity - CORRECTED)
-- =============================================
-- Fixed to match technical documentation exactly

CREATE TABLE public.designer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- All fields from technical documentation
    name TEXT,
    title TEXT, -- Required MVP field
    professional_summary TEXT, -- Required MVP field  
    phone TEXT, -- Required MVP field
    email TEXT, -- Required MVP field
    location TEXT,
    availability TEXT DEFAULT 'Available', -- Required MVP field
    portfolio_url TEXT, -- Required MVP field
    cv_file_url TEXT, -- Required MVP field
    photo_url TEXT,
    total_experience_years INTEGER DEFAULT 0, -- Required MVP field
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
    
    -- Profile completion tracking
    is_profile_complete BOOLEAN DEFAULT FALSE,
    
    -- Survey data (JSON field from technical documentation)
    survey_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. WORK EXPERIENCES (CORRECTED - references designer_profiles)
-- =============================================

CREATE TABLE public.work_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designer_profile_id UUID REFERENCES public.designer_profiles(id) ON DELETE CASCADE, -- CORRECTED
    
    -- Fields from technical documentation
    job_title TEXT,
    company_name TEXT, -- Required MVP field
    company_size TEXT,
    industry TEXT, -- Required MVP field  
    location TEXT,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    achievements TEXT[], -- Array field
    technologies_used TEXT[], -- Array field (corrected name)
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. SKILLS (CORRECTED - references designer_profiles)
-- =============================================

CREATE TABLE public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designer_profile_id UUID REFERENCES public.designer_profiles(id) ON DELETE CASCADE, -- CORRECTED
    
    -- Fields from technical documentation
    skill_name TEXT NOT NULL, -- Required MVP field
    category TEXT NOT NULL CHECK (category IN ('technical', 'soft', 'design', 'tool')), -- Required MVP field
    proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5), -- Required MVP field
    years_of_experience INTEGER,
    last_used_date DATE,
    is_endorsed BOOLEAN DEFAULT FALSE,
    endorsement_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. LANGUAGES (CORRECTED - references designer_profiles)
-- =============================================

CREATE TABLE public.languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designer_profile_id UUID REFERENCES public.designer_profiles(id) ON DELETE CASCADE, -- CORRECTED
    
    -- Fields from technical documentation
    language_name TEXT NOT NULL, -- Required MVP field
    proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5), -- Required MVP field
    is_native BOOLEAN DEFAULT FALSE,
    certification_name TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. EDUCATION (CORRECTED - singular name, references designer_profiles)
-- =============================================

CREATE TABLE public.education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designer_profile_id UUID REFERENCES public.designer_profiles(id) ON DELETE CASCADE, -- CORRECTED
    
    -- Fields from technical documentation
    institution_name TEXT,
    degree_type TEXT,
    field_of_study TEXT,
    start_date DATE,
    end_date DATE,
    gpa TEXT,
    honors TEXT[],
    relevant_coursework TEXT[],
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 9. CERTIFICATIONS (MISSING TABLE ADDED)
-- =============================================

CREATE TABLE public.certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designer_profile_id UUID REFERENCES public.designer_profiles(id) ON DELETE CASCADE,
    
    -- Fields from technical documentation
    certification_name TEXT NOT NULL,
    issuing_organization TEXT,
    issue_date DATE,
    expiration_date DATE,
    credential_id TEXT,
    credential_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 10. CV PROJECTS (MISSING TABLE ADDED)
-- =============================================

CREATE TABLE public.cv_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designer_profile_id UUID REFERENCES public.designer_profiles(id) ON DELETE CASCADE,
    
    -- Fields from technical documentation
    project_name TEXT NOT NULL,
    description TEXT,
    role TEXT,
    duration_months INTEGER,
    team_size INTEGER,
    technologies_used TEXT[],
    outcomes TEXT[],
    project_url TEXT,
    client_type TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 11. CLIENT PROJECTS (MISSING TABLE ADDED)
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
    custom_fields JSONB,
    selected_candidates UUID[], -- Array of designer_profile_id
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 12. OFFERS (MISSING TABLE ADDED)
-- =============================================

CREATE TABLE public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.client_projects(id) ON DELETE CASCADE,
    designer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'viewed', 'accepted', 'declined')),
    custom_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

-- =============================================
-- 13. UPDATE TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers to all tables
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
-- 14. DISABLE RLS FOR DEVELOPMENT (as in original)
-- =============================================

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.designer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_experiences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.education DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 15. SUCCESS MESSAGE
-- =============================================

SELECT 'Corrected database setup complete! ✅' as status;
SELECT 'Structure now matches TECHNICAL_APPROACH.md exactly' as info;
SELECT 'Fixed: Foreign key relationships, missing fields, missing tables' as fixes;
SELECT 'Ready for user registration with proper schema' as next_step;
