-- HubHub Row Level Security Policies
-- This migration sets up comprehensive RLS policies for role-based access control

-- =============================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================
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

-- =============================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- =============================================

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

-- =============================================
-- USERS TABLE POLICIES
-- =============================================

-- Users can read their own record, admins can read all
CREATE POLICY "Users can read own profile, admins read all"
    ON users FOR SELECT
    USING (
        auth.uid() = id OR is_admin()
    );

-- Users can update their own record, admins can update all
CREATE POLICY "Users can update own profile, admins update all"
    ON users FOR UPDATE
    USING (
        auth.uid() = id OR is_admin()
    );

-- Only authenticated users can insert (handled by auth trigger)
CREATE POLICY "Authenticated users can insert"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =============================================
-- DESIGNER PROFILES TABLE POLICIES
-- =============================================

-- Designers can read/update their own profile
-- Admins can read ALL profiles (for browsing/matching)
-- Clients can only read profiles that are complete and in their project offers
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

-- Only designers can update their own profile, admins can update any
CREATE POLICY "Designer profile update control"
    ON designer_profiles FOR UPDATE
    USING (
        (is_designer() AND user_id = auth.uid()) OR is_admin()
    );

-- Only designers can create their own profile
CREATE POLICY "Designer profile creation control"
    ON designer_profiles FOR INSERT
    WITH CHECK (
        is_designer() AND user_id = auth.uid()
    );

-- =============================================
-- DESIGNER DETAIL TABLES POLICIES (work_experiences, skills, etc.)
-- =============================================

-- Generic policy for designer detail tables - designers own their data, admins see all
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

-- Apply similar policies to all designer detail tables
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

-- =============================================
-- PROJECTS TABLE POLICIES
-- =============================================

-- Clients can read/update their own projects, admins can see all
CREATE POLICY "Project access control"
    ON projects FOR SELECT
    USING (
        (is_client() AND client_id = auth.uid()) OR is_admin()
    );

-- Clients can update their own projects, admins can update any
CREATE POLICY "Project update control"
    ON projects FOR UPDATE
    USING (
        (is_client() AND client_id = auth.uid()) OR is_admin()
    );

-- Only clients can create projects
CREATE POLICY "Project creation control"
    ON projects FOR INSERT
    WITH CHECK (
        is_client() AND client_id = auth.uid()
    );

-- =============================================
-- OFFERS TABLE POLICIES
-- =============================================

-- Designers can see offers sent to them
-- Clients can see offers for their projects
-- Admins can see all offers
CREATE POLICY "Offer read access"
    ON offers FOR SELECT
    USING (
        (is_designer() AND designer_id = auth.uid()) OR
        (is_client() AND project_id IN (
            SELECT id FROM projects WHERE client_id = auth.uid()
        )) OR
        is_admin()
    );

-- Only admins can create/update offers (they manage the matching process)
CREATE POLICY "Offer write access"
    ON offers FOR ALL
    USING (is_admin());

-- Designers can update offer status (respond to offers)
CREATE POLICY "Designer offer response"
    ON offers FOR UPDATE
    USING (
        is_designer() AND designer_id = auth.uid()
    );

-- =============================================
-- EVALUATIONS TABLE POLICIES
-- =============================================

-- Clients can read evaluations for their projects
-- Designers can read evaluations about them
-- Admins can see all
CREATE POLICY "Evaluation read access"
    ON evaluations FOR SELECT
    USING (
        (is_client() AND project_id IN (
            SELECT id FROM projects WHERE client_id = auth.uid()
        )) OR
        (is_designer() AND designer_id = auth.uid()) OR
        is_admin()
    );

-- Only clients can create evaluations for their projects
CREATE POLICY "Evaluation creation control"
    ON evaluations FOR INSERT
    WITH CHECK (
        is_client() AND project_id IN (
            SELECT id FROM projects WHERE client_id = auth.uid()
        )
    );

-- =============================================
-- UPDATE REQUESTS TABLE POLICIES
-- =============================================

-- Designers can see update requests for them
-- Admins can see all update requests
-- Requesters can see their own requests
CREATE POLICY "Update request read access"
    ON update_requests FOR SELECT
    USING (
        (is_designer() AND designer_id = auth.uid()) OR
        (requested_by = auth.uid()) OR
        is_admin()
    );

-- Anyone can create update requests, admins can update status
CREATE POLICY "Update request write access"
    ON update_requests FOR INSERT
    WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Update request status control"
    ON update_requests FOR UPDATE
    USING (is_admin());
