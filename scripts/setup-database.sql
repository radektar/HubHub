-- Quick Database Setup Script
-- Copy and paste this into Supabase SQL Editor: https://supabase.com/dashboard/project/onvekvladcenwdqlmjtw/sql

-- Create custom types
CREATE TYPE user_role AS ENUM ('designer', 'client', 'admin');
CREATE TYPE project_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');
CREATE TYPE offer_status AS ENUM ('sent', 'viewed', 'accepted', 'declined', 'expired');
CREATE TYPE update_request_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE skill_category AS ENUM ('technical', 'soft', 'design', 'tool');

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'designer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create designer_profiles table
CREATE TABLE IF NOT EXISTS designer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Required MVP fields
    name TEXT,
    title TEXT NOT NULL, 
    phone TEXT NOT NULL, 
    email TEXT NOT NULL, 
    availability TEXT NOT NULL, 
    portfolio_url TEXT NOT NULL, 
    cv_file_url TEXT NOT NULL, 
    professional_summary TEXT NOT NULL, 
    total_experience_years INTEGER NOT NULL, 
    
    -- Optional fields
    location TEXT,
    photo_url TEXT,
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
    
    -- System fields
    is_profile_complete BOOLEAN DEFAULT FALSE,
    survey_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create work_experiences table
CREATE TABLE IF NOT EXISTS work_experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    designer_profile_id UUID NOT NULL REFERENCES designer_profiles(id) ON DELETE CASCADE,
    
    -- Required MVP fields
    company_name TEXT NOT NULL,
    industry TEXT NOT NULL,
    
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

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    designer_profile_id UUID NOT NULL REFERENCES designer_profiles(id) ON DELETE CASCADE,
    
    -- Required MVP fields
    skill_name TEXT NOT NULL,
    category skill_category NOT NULL,
    proficiency_level INTEGER NOT NULL CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
    
    -- Optional fields
    years_of_experience INTEGER,
    last_used_date DATE,
    is_endorsed BOOLEAN DEFAULT FALSE,
    endorsement_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create languages table
CREATE TABLE IF NOT EXISTS languages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    designer_profile_id UUID NOT NULL REFERENCES designer_profiles(id) ON DELETE CASCADE,
    
    -- Required MVP fields
    language_name TEXT NOT NULL,
    proficiency_level INTEGER NOT NULL CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
    
    -- Optional fields
    is_native BOOLEAN DEFAULT FALSE,
    certification_name TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create educations table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_designer_profiles_user_id ON designer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_designer_profiles_complete ON designer_profiles(is_profile_complete);
CREATE INDEX IF NOT EXISTS idx_work_experiences_profile_id ON work_experiences(designer_profile_id);
CREATE INDEX IF NOT EXISTS idx_skills_profile_id ON skills(designer_profile_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_languages_profile_id ON languages(designer_profile_id);

-- Profile completion validation function
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

-- Trigger to auto-update profile completion
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
DROP TRIGGER IF EXISTS trigger_designer_profiles_completion ON designer_profiles;
CREATE TRIGGER trigger_designer_profiles_completion
    AFTER INSERT OR UPDATE ON designer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion();

DROP TRIGGER IF EXISTS trigger_skills_completion ON skills;
CREATE TRIGGER trigger_skills_completion
    AFTER INSERT OR UPDATE OR DELETE ON skills
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion();

DROP TRIGGER IF EXISTS trigger_work_experiences_completion ON work_experiences;
CREATE TRIGGER trigger_work_experiences_completion
    AFTER INSERT OR UPDATE OR DELETE ON work_experiences
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion();

DROP TRIGGER IF EXISTS trigger_languages_completion ON languages;
CREATE TRIGGER trigger_languages_completion
    AFTER INSERT OR UPDATE OR DELETE ON languages
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_designer_profiles_updated_at ON designer_profiles;
CREATE TRIGGER update_designer_profiles_updated_at BEFORE UPDATE ON designer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_work_experiences_updated_at ON work_experiences;
CREATE TRIGGER update_work_experiences_updated_at BEFORE UPDATE ON work_experiences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_skills_updated_at ON skills;
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_languages_updated_at ON languages;
CREATE TRIGGER update_languages_updated_at BEFORE UPDATE ON languages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_educations_updated_at ON educations;
CREATE TRIGGER update_educations_updated_at BEFORE UPDATE ON educations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verification queries
SELECT 'Database setup complete!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'designer_profiles', 'work_experiences', 'skills', 'languages', 'educations') ORDER BY table_name;


