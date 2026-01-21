-- ============================================
-- HubHub - Complete Database Setup
-- ============================================
-- This script creates the complete database structure for HubHub
-- Copy and paste this entire file into Supabase SQL Editor
-- 
-- Instructions:
-- 1. Go to: https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/sql
-- 2. Click "New query"
-- 3. Paste this entire file
-- 4. Click "Run" or press Cmd+Enter
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CREATE CUSTOM TYPES
-- ============================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('designer', 'client', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE offer_status AS ENUM ('sent', 'viewed', 'accepted', 'declined', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE update_request_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE skill_category AS ENUM ('technical', 'soft', 'design', 'tool');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 1. USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'designer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. DESIGNER PROFILES TABLE (Main profile data)
-- ============================================
CREATE TABLE IF NOT EXISTS designer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Required MVP fields
    name TEXT,
    title TEXT NOT NULL, -- Required: position/title
    phone TEXT NOT NULL, -- Required: phone
    email TEXT NOT NULL, -- Required: email (can differ from auth email)
    availability TEXT NOT NULL, -- Required: availability status
    portfolio_url TEXT NOT NULL, -- Required: portfolio URL
    cv_file_url TEXT NOT NULL, -- Required: CV file URL
    professional_summary TEXT NOT NULL, -- Required: professional summary
    total_experience_years INTEGER NOT NULL, -- Required: total experience
    
    -- Optional fields
    location TEXT,
    photo_url TEXT,
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
    
    -- System fields
    is_profile_complete BOOLEAN DEFAULT FALSE,
    survey_data JSONB, -- Stores survey responses
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. WORK EXPERIENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS work_experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    designer_profile_id UUID NOT NULL REFERENCES designer_profiles(id) ON DELETE CASCADE,
    
    -- Required MVP fields
    company_name TEXT NOT NULL, -- Required: companies worked for
    industry TEXT NOT NULL, -- Required: industry experience
    
    -- Optional fields
    job_title TEXT,
    company_size TEXT,
    location TEXT,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    achievements TEXT[],
    technologies_used TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. EDUCATIONS TABLE (All optional for MVP)
-- ============================================
CREATE TABLE IF NOT EXISTS educations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    designer_profile_id UUID NOT NULL REFERENCES designer_profiles(id) ON DELETE CASCADE,
    
    institution_name TEXT,
    degree_type TEXT,
    field_of_study TEXT,
    start_date DATE,
    end_date DATE,
    gpa DECIMAL(3,2),
    honors TEXT[],
    relevant_coursework TEXT[],
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. SKILLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    designer_profile_id UUID NOT NULL REFERENCES designer_profiles(id) ON DELETE CASCADE,
    
    -- Required MVP fields
    skill_name TEXT NOT NULL, -- Required: skill name
    category skill_category NOT NULL, -- Required: skills category
    proficiency_level INTEGER NOT NULL CHECK (proficiency_level >= 1 AND proficiency_level <= 5), -- Required: 1-5 scale
    
    -- Optional fields
    years_of_experience INTEGER,
    last_used_date DATE,
    is_endorsed BOOLEAN DEFAULT FALSE,
    endorsement_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. CERTIFICATIONS TABLE (All optional for MVP)
-- ============================================
CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    designer_profile_id UUID NOT NULL REFERENCES designer_profiles(id) ON DELETE CASCADE,
    
    certification_name TEXT,
    issuing_organization TEXT,
    issue_date DATE,
    expiration_date DATE,
    credential_id TEXT,
    credential_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. LANGUAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS languages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    designer_profile_id UUID NOT NULL REFERENCES designer_profiles(id) ON DELETE CASCADE,
    
    -- Required MVP fields
    language_name TEXT NOT NULL, -- Required: language name
    proficiency_level INTEGER NOT NULL CHECK (proficiency_level >= 1 AND proficiency_level <= 5), -- Required: 1-5 scale
    
    -- Optional fields
    is_native BOOLEAN DEFAULT FALSE,
    certification_name TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. CV PROJECTS TABLE (All optional for MVP)
-- ============================================
CREATE TABLE IF NOT EXISTS cv_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    designer_profile_id UUID NOT NULL REFERENCES designer_profiles(id) ON DELETE CASCADE,
    
    project_name TEXT,
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

-- ============================================
-- 9. AWARDS HONORS TABLE (All optional for MVP)
-- ============================================
CREATE TABLE IF NOT EXISTS awards_honors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    designer_profile_id UUID NOT NULL REFERENCES designer_profiles(id) ON DELETE CASCADE,
    
    title TEXT,
    issuing_organization TEXT,
    issue_date DATE,
    description TEXT,
    award_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. PUBLICATIONS TABLE (All optional for MVP)
-- ============================================
CREATE TABLE IF NOT EXISTS publications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    designer_profile_id UUID NOT NULL REFERENCES designer_profiles(id) ON DELETE CASCADE,
    
    title TEXT,
    publication_type TEXT,
    publisher TEXT,
    publication_date DATE,
    description TEXT,
    publication_url TEXT,
    co_authors TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. PROFESSIONAL REFERENCES TABLE (All optional for MVP)
-- ============================================
CREATE TABLE IF NOT EXISTS professional_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    designer_profile_id UUID NOT NULL REFERENCES designer_profiles(id) ON DELETE CASCADE,
    
    reference_name TEXT,
    title TEXT,
    company TEXT,
    relationship TEXT,
    email TEXT,
    phone TEXT,
    linkedin_url TEXT,
    reference_text TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. VOLUNTEER EXPERIENCES TABLE (All optional for MVP)
-- ============================================
CREATE TABLE IF NOT EXISTS volunteer_experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    designer_profile_id UUID NOT NULL REFERENCES designer_profiles(id) ON DELETE CASCADE,
    
    organization_name TEXT,
    role TEXT,
    start_date DATE,
    end_date DATE,
    description TEXT,
    skills_used TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 13. PROJECTS TABLE (Client project submissions)
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements JSONB, -- Structured project requirements
    budget_range TEXT,
    timeline TEXT,
    status project_status DEFAULT 'draft',
    custom_fields JSONB, -- Additional custom fields from client
    selected_candidates UUID[], -- Admin-curated shortlist
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 14. OFFERS TABLE (Project offers to designers)
-- ============================================
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    designer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    status offer_status DEFAULT 'sent',
    custom_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(project_id, designer_id) -- Prevent duplicate offers
);

-- ============================================
-- 15. EVALUATIONS TABLE (Client feedback on designers)
-- ============================================
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    designer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
    client_feedback TEXT,
    work_samples TEXT[], -- URLs to work samples
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(project_id, designer_id) -- One evaluation per designer per project
);

-- ============================================
-- 16. UPDATE REQUESTS TABLE (Profile update requests)
-- ============================================
CREATE TABLE IF NOT EXISTS update_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    designer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    message TEXT NOT NULL,
    status update_request_status DEFAULT 'pending',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_designer_profiles_user_id ON designer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_designer_profiles_complete ON designer_profiles(is_profile_complete);
CREATE INDEX IF NOT EXISTS idx_work_experiences_profile_id ON work_experiences(designer_profile_id);
CREATE INDEX IF NOT EXISTS idx_skills_profile_id ON skills(designer_profile_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_languages_profile_id ON languages(designer_profile_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_offers_project_id ON offers(project_id);
CREATE INDEX IF NOT EXISTS idx_offers_designer_id ON offers(designer_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);

-- ============================================
-- PROFILE COMPLETION VALIDATION FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION check_profile_completion(profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    profile_record designer_profiles%ROWTYPE;
    has_required_skills BOOLEAN := FALSE;
    has_required_work BOOLEAN := FALSE;
    has_required_languages BOOLEAN := FALSE;
BEGIN
    -- Get the designer profile
    SELECT * INTO profile_record 
    FROM designer_profiles 
    WHERE id = profile_id;
    
    -- Check if profile exists
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check required MVP fields in designer_profiles
    IF profile_record.title IS NULL OR profile_record.title = '' OR
       profile_record.phone IS NULL OR profile_record.phone = '' OR
       profile_record.email IS NULL OR profile_record.email = '' OR
       profile_record.availability IS NULL OR profile_record.availability = '' OR
       profile_record.portfolio_url IS NULL OR profile_record.portfolio_url = '' OR
       profile_record.cv_file_url IS NULL OR profile_record.cv_file_url = '' OR
       profile_record.professional_summary IS NULL OR profile_record.professional_summary = '' OR
       profile_record.total_experience_years IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check for at least one skill with required fields
    SELECT EXISTS(
        SELECT 1 FROM skills 
        WHERE designer_profile_id = profile_id 
        AND skill_name IS NOT NULL AND skill_name != ''
        AND category IS NOT NULL 
        AND proficiency_level IS NOT NULL
    ) INTO has_required_skills;
    
    -- Check for at least one work experience with required fields
    SELECT EXISTS(
        SELECT 1 FROM work_experiences 
        WHERE designer_profile_id = profile_id 
        AND company_name IS NOT NULL AND company_name != ''
        AND industry IS NOT NULL AND industry != ''
    ) INTO has_required_work;
    
    -- Check for at least one language with required fields
    SELECT EXISTS(
        SELECT 1 FROM languages 
        WHERE designer_profile_id = profile_id 
        AND language_name IS NOT NULL AND language_name != ''
        AND proficiency_level IS NOT NULL
    ) INTO has_required_languages;
    
    -- All requirements must be met
    RETURN has_required_skills AND has_required_work AND has_required_languages;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER TO AUTO-UPDATE PROFILE COMPLETION
-- ============================================
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
    profile_id UUID;
    is_complete BOOLEAN;
BEGIN
    -- Determine the profile_id based on the table being modified
    IF TG_TABLE_NAME = 'designer_profiles' THEN
        profile_id := COALESCE(NEW.id, OLD.id);
    ELSE
        profile_id := COALESCE(NEW.designer_profile_id, OLD.designer_profile_id);
    END IF;
    
    -- Check if profile is complete
    SELECT check_profile_completion(profile_id) INTO is_complete;
    
    -- Update the is_profile_complete flag
    UPDATE designer_profiles 
    SET is_profile_complete = is_complete, 
        updated_at = NOW()
    WHERE id = profile_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_designer_profiles_completion ON designer_profiles;
DROP TRIGGER IF EXISTS trigger_skills_completion ON skills;
DROP TRIGGER IF EXISTS trigger_work_experiences_completion ON work_experiences;
DROP TRIGGER IF EXISTS trigger_languages_completion ON languages;

-- Create triggers for profile completion checking
CREATE TRIGGER trigger_designer_profiles_completion
    AFTER INSERT OR UPDATE ON designer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion();

CREATE TRIGGER trigger_skills_completion
    AFTER INSERT OR UPDATE OR DELETE ON skills
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion();

CREATE TRIGGER trigger_work_experiences_completion
    AFTER INSERT OR UPDATE OR DELETE ON work_experiences
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion();

CREATE TRIGGER trigger_languages_completion
    AFTER INSERT OR UPDATE OR DELETE ON languages
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion();

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing updated_at triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_designer_profiles_updated_at ON designer_profiles;
DROP TRIGGER IF EXISTS update_work_experiences_updated_at ON work_experiences;
DROP TRIGGER IF EXISTS update_educations_updated_at ON educations;
DROP TRIGGER IF EXISTS update_skills_updated_at ON skills;
DROP TRIGGER IF EXISTS update_certifications_updated_at ON certifications;
DROP TRIGGER IF EXISTS update_languages_updated_at ON languages;
DROP TRIGGER IF EXISTS update_cv_projects_updated_at ON cv_projects;
DROP TRIGGER IF EXISTS update_awards_honors_updated_at ON awards_honors;
DROP TRIGGER IF EXISTS update_publications_updated_at ON publications;
DROP TRIGGER IF EXISTS update_professional_references_updated_at ON professional_references;
DROP TRIGGER IF EXISTS update_volunteer_experiences_updated_at ON volunteer_experiences;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_offers_updated_at ON offers;

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_designer_profiles_updated_at BEFORE UPDATE ON designer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_experiences_updated_at BEFORE UPDATE ON work_experiences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_educations_updated_at BEFORE UPDATE ON educations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_languages_updated_at BEFORE UPDATE ON languages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cv_projects_updated_at BEFORE UPDATE ON cv_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_awards_honors_updated_at BEFORE UPDATE ON awards_honors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_publications_updated_at BEFORE UPDATE ON publications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professional_references_updated_at BEFORE UPDATE ON professional_references FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_volunteer_experiences_updated_at BEFORE UPDATE ON volunteer_experiences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY SETUP
-- ============================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE designer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards_honors ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- ============================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is designer
CREATE OR REPLACE FUNCTION is_designer()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'designer';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is client
CREATE OR REPLACE FUNCTION is_client()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'client';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile, admins read all" ON users;
DROP POLICY IF EXISTS "Users can update own profile, admins update all" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert" ON users;
DROP POLICY IF EXISTS "Designer profile access control" ON designer_profiles;
DROP POLICY IF EXISTS "Designer profile update control" ON designer_profiles;
DROP POLICY IF EXISTS "Designer profile creation control" ON designer_profiles;

-- USERS TABLE POLICIES
CREATE POLICY "Users can read own profile, admins read all"
    ON users FOR SELECT
    USING (
        auth.uid() = id OR is_admin()
    );

CREATE POLICY "Users can update own profile, admins update all"
    ON users FOR UPDATE
    USING (
        auth.uid() = id OR is_admin()
    );

CREATE POLICY "Authenticated users can insert"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- DESIGNER PROFILES TABLE POLICIES
CREATE POLICY "Designer profile access control"
    ON designer_profiles FOR SELECT
    USING (
        -- Designers can see their own profile
        (is_designer() AND user_id = auth.uid()) OR
        -- Admins can see all profiles
        is_admin() OR
        -- Clients can only see complete profiles that are part of their project offers
        (is_client() AND is_profile_complete = true AND id IN (
            SELECT dp.id 
            FROM designer_profiles dp
            JOIN offers o ON o.designer_id = dp.user_id
            JOIN projects p ON p.id = o.project_id
            WHERE p.client_id = auth.uid()
        ))
    );

CREATE POLICY "Designer profile update control"
    ON designer_profiles FOR UPDATE
    USING (
        (is_designer() AND user_id = auth.uid()) OR is_admin()
    );

CREATE POLICY "Designer profile creation control"
    ON designer_profiles FOR INSERT
    WITH CHECK (
        is_designer() AND user_id = auth.uid()
    );

-- DESIGNER DETAIL TABLES POLICIES
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

CREATE POLICY "Designer detail read access"
    ON work_experiences FOR SELECT
    USING (
        designer_profile_id IN (
            SELECT id FROM designer_profiles 
            WHERE (user_id = auth.uid() AND is_designer()) OR is_admin()
        )
    );

CREATE POLICY "Designer detail write access"
    ON work_experiences FOR ALL
    USING (
        designer_profile_id IN (
            SELECT id FROM designer_profiles 
            WHERE user_id = auth.uid() AND is_designer()
        ) OR is_admin()
    );

CREATE POLICY "Skills read access" ON skills FOR SELECT USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE (user_id = auth.uid() AND is_designer()) OR is_admin()
    )
);

CREATE POLICY "Skills write access" ON skills FOR ALL USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE user_id = auth.uid() AND is_designer()
    ) OR is_admin()
);

CREATE POLICY "Languages read access" ON languages FOR SELECT USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE (user_id = auth.uid() AND is_designer()) OR is_admin()
    )
);

CREATE POLICY "Languages write access" ON languages FOR ALL USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE user_id = auth.uid() AND is_designer()
    ) OR is_admin()
);

CREATE POLICY "Educations read access" ON educations FOR SELECT USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE (user_id = auth.uid() AND is_designer()) OR is_admin()
    )
);

CREATE POLICY "Educations write access" ON educations FOR ALL USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE user_id = auth.uid() AND is_designer()
    ) OR is_admin()
);

CREATE POLICY "Certifications read access" ON certifications FOR SELECT USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE (user_id = auth.uid() AND is_designer()) OR is_admin()
    )
);

CREATE POLICY "Certifications write access" ON certifications FOR ALL USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE user_id = auth.uid() AND is_designer()
    ) OR is_admin()
);

CREATE POLICY "CV Projects read access" ON cv_projects FOR SELECT USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE (user_id = auth.uid() AND is_designer()) OR is_admin()
    )
);

CREATE POLICY "CV Projects write access" ON cv_projects FOR ALL USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE user_id = auth.uid() AND is_designer()
    ) OR is_admin()
);

CREATE POLICY "Awards read access" ON awards_honors FOR SELECT USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE (user_id = auth.uid() AND is_designer()) OR is_admin()
    )
);

CREATE POLICY "Awards write access" ON awards_honors FOR ALL USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE user_id = auth.uid() AND is_designer()
    ) OR is_admin()
);

CREATE POLICY "Publications read access" ON publications FOR SELECT USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE (user_id = auth.uid() AND is_designer()) OR is_admin()
    )
);

CREATE POLICY "Publications write access" ON publications FOR ALL USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE user_id = auth.uid() AND is_designer()
    ) OR is_admin()
);

CREATE POLICY "References read access" ON professional_references FOR SELECT USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE (user_id = auth.uid() AND is_designer()) OR is_admin()
    )
);

CREATE POLICY "References write access" ON professional_references FOR ALL USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE user_id = auth.uid() AND is_designer()
    ) OR is_admin()
);

CREATE POLICY "Volunteer read access" ON volunteer_experiences FOR SELECT USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE (user_id = auth.uid() AND is_designer()) OR is_admin()
    )
);

CREATE POLICY "Volunteer write access" ON volunteer_experiences FOR ALL USING (
    designer_profile_id IN (
        SELECT id FROM designer_profiles 
        WHERE user_id = auth.uid() AND is_designer()
    ) OR is_admin()
);

-- PROJECTS TABLE POLICIES
DROP POLICY IF EXISTS "Project access control" ON projects;
DROP POLICY IF EXISTS "Project update control" ON projects;
DROP POLICY IF EXISTS "Project creation control" ON projects;

CREATE POLICY "Project access control"
    ON projects FOR SELECT
    USING (
        (is_client() AND client_id = auth.uid()) OR is_admin()
    );

CREATE POLICY "Project update control"
    ON projects FOR UPDATE
    USING (
        (is_client() AND client_id = auth.uid()) OR is_admin()
    );

CREATE POLICY "Project creation control"
    ON projects FOR INSERT
    WITH CHECK (
        is_client() AND client_id = auth.uid()
    );

-- OFFERS TABLE POLICIES
DROP POLICY IF EXISTS "Offer read access" ON offers;
DROP POLICY IF EXISTS "Offer write access" ON offers;
DROP POLICY IF EXISTS "Designer offer response" ON offers;

CREATE POLICY "Offer read access"
    ON offers FOR SELECT
    USING (
        (is_designer() AND designer_id = auth.uid()) OR
        (is_client() AND project_id IN (
            SELECT id FROM projects WHERE client_id = auth.uid()
        )) OR
        is_admin()
    );

CREATE POLICY "Offer write access"
    ON offers FOR ALL
    USING (is_admin());

CREATE POLICY "Designer offer response"
    ON offers FOR UPDATE
    USING (
        is_designer() AND designer_id = auth.uid()
    );

-- EVALUATIONS TABLE POLICIES
DROP POLICY IF EXISTS "Evaluation read access" ON evaluations;
DROP POLICY IF EXISTS "Evaluation creation control" ON evaluations;

CREATE POLICY "Evaluation read access"
    ON evaluations FOR SELECT
    USING (
        (is_client() AND project_id IN (
            SELECT id FROM projects WHERE client_id = auth.uid()
        )) OR
        (is_designer() AND designer_id = auth.uid()) OR
        is_admin()
    );

CREATE POLICY "Evaluation creation control"
    ON evaluations FOR INSERT
    WITH CHECK (
        is_client() AND project_id IN (
            SELECT id FROM projects WHERE client_id = auth.uid()
        )
    );

-- UPDATE REQUESTS TABLE POLICIES
DROP POLICY IF EXISTS "Update request read access" ON update_requests;
DROP POLICY IF EXISTS "Update request write access" ON update_requests;
DROP POLICY IF EXISTS "Update request status control" ON update_requests;

CREATE POLICY "Update request read access"
    ON update_requests FOR SELECT
    USING (
        (is_designer() AND designer_id = auth.uid()) OR
        (requested_by = auth.uid()) OR
        is_admin()
    );

CREATE POLICY "Update request write access"
    ON update_requests FOR INSERT
    WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Update request status control"
    ON update_requests FOR UPDATE
    USING (is_admin());

-- ============================================
-- AUTH TRIGGER: Auto-create user record
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, 'designer'::user_role)
    ON CONFLICT (id) DO UPDATE SET email = NEW.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create user record when auth user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '📊 Created 16 tables with RLS policies';
    RAISE NOTICE '🔒 Row Level Security enabled on all tables';
    RAISE NOTICE '⚡ Triggers and functions configured';
END $$;
