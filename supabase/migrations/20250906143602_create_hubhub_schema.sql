-- HubHub Database Schema Migration
-- This migration creates the complete database structure for the HubHub platform
-- with all required tables, relationships, and Row Level Security policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('designer', 'client', 'admin');
CREATE TYPE project_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');
CREATE TYPE offer_status AS ENUM ('sent', 'viewed', 'accepted', 'declined', 'expired');
CREATE TYPE update_request_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE skill_category AS ENUM ('technical', 'soft', 'design', 'tool');

-- =============================================
-- 1. USERS TABLE (extends Supabase auth.users)
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'designer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. DESIGNER PROFILES TABLE (Main profile data)
-- =============================================
CREATE TABLE designer_profiles (
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

-- =============================================
-- 3. WORK EXPERIENCES TABLE
-- =============================================
CREATE TABLE work_experiences (
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

-- =============================================
-- 4. EDUCATIONS TABLE (All optional for MVP)
-- =============================================
CREATE TABLE educations (
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

-- =============================================
-- 5. SKILLS TABLE
-- =============================================
CREATE TABLE skills (
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

-- =============================================
-- 6. CERTIFICATIONS TABLE (All optional for MVP)
-- =============================================
CREATE TABLE certifications (
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

-- =============================================
-- 7. LANGUAGES TABLE
-- =============================================
CREATE TABLE languages (
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

-- =============================================
-- 8. CV PROJECTS TABLE (All optional for MVP)
-- =============================================
CREATE TABLE cv_projects (
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

-- =============================================
-- 9. AWARDS HONORS TABLE (All optional for MVP)
-- =============================================
CREATE TABLE awards_honors (
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

-- =============================================
-- 10. PUBLICATIONS TABLE (All optional for MVP)
-- =============================================
CREATE TABLE publications (
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

-- =============================================
-- 11. PROFESSIONAL REFERENCES TABLE (All optional for MVP)
-- =============================================
CREATE TABLE professional_references (
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

-- =============================================
-- 12. VOLUNTEER EXPERIENCES TABLE (All optional for MVP)
-- =============================================
CREATE TABLE volunteer_experiences (
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

-- =============================================
-- 13. PROJECTS TABLE (Client project submissions)
-- =============================================
CREATE TABLE projects (
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

-- =============================================
-- 14. OFFERS TABLE (Project offers to designers)
-- =============================================
CREATE TABLE offers (
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

-- =============================================
-- 15. EVALUATIONS TABLE (Client feedback on designers)
-- =============================================
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    designer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
    client_feedback TEXT,
    work_samples TEXT[], -- URLs to work samples
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(project_id, designer_id) -- One evaluation per designer per project
);

-- =============================================
-- 16. UPDATE REQUESTS TABLE (Profile update requests)
-- =============================================
CREATE TABLE update_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    designer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    message TEXT NOT NULL,
    status update_request_status DEFAULT 'pending',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_designer_profiles_user_id ON designer_profiles(user_id);
CREATE INDEX idx_designer_profiles_complete ON designer_profiles(is_profile_complete);
CREATE INDEX idx_work_experiences_profile_id ON work_experiences(designer_profile_id);
CREATE INDEX idx_skills_profile_id ON skills(designer_profile_id);
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_languages_profile_id ON languages(designer_profile_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_offers_project_id ON offers(project_id);
CREATE INDEX idx_offers_designer_id ON offers(designer_id);
CREATE INDEX idx_offers_status ON offers(status);

-- =============================================
-- PROFILE COMPLETION VALIDATION FUNCTION
-- =============================================
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

-- =============================================
-- TRIGGER TO AUTO-UPDATE PROFILE COMPLETION
-- =============================================
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

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
