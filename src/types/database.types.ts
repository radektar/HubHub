// Database types for HubHub platform - Complete Schema

export type UserRole = 'designer' | 'client' | 'admin'
export type ProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
export type OfferStatus = 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired'
export type UpdateRequestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type SkillCategory = 'technical' | 'soft' | 'design' | 'tool'

export interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface DesignerProfile {
  id: string
  user_id: string
  
  // Required MVP fields
  name?: string
  title: string
  phone: string
  email: string
  availability: string
  portfolio_url: string
  cv_file_url: string
  professional_summary: string
  total_experience_years: number
  
  // Optional fields
  location?: string
  photo_url?: string
  rating?: number
  
  // System fields
  is_profile_complete: boolean
  survey_data?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface WorkExperience {
  id: string
  designer_profile_id: string
  
  // Required MVP fields
  company_name: string
  industry: string
  
  // Optional fields
  job_title?: string
  company_size?: string
  location?: string
  start_date?: string
  end_date?: string
  is_current?: boolean
  description?: string
  achievements?: string[]
  technologies_used?: string[]
  
  created_at: string
  updated_at: string
}

export interface Education {
  id: string
  designer_profile_id: string
  institution_name?: string
  degree_type?: string
  field_of_study?: string
  start_date?: string
  end_date?: string
  gpa?: number
  honors?: string[]
  relevant_coursework?: string[]
  description?: string
  created_at: string
  updated_at: string
}

export interface Skill {
  id: string
  designer_profile_id: string
  
  // Required MVP fields
  skill_name: string
  category: SkillCategory
  proficiency_level: number // 1-5
  
  // Optional fields
  years_of_experience?: number
  last_used_date?: string
  is_endorsed?: boolean
  endorsement_count?: number
  
  created_at: string
  updated_at: string
}

export interface Certification {
  id: string
  designer_profile_id: string
  certification_name?: string
  issuing_organization?: string
  issue_date?: string
  expiration_date?: string
  credential_id?: string
  credential_url?: string
  is_verified?: boolean
  created_at: string
  updated_at: string
}

export interface Language {
  id: string
  designer_profile_id: string
  
  // Required MVP fields
  language_name: string
  proficiency_level: number // 1-5
  
  // Optional fields
  is_native?: boolean
  certification_name?: string
  
  created_at: string
  updated_at: string
}

export interface CVProject {
  id: string
  designer_profile_id: string
  project_name?: string
  description?: string
  role?: string
  duration_months?: number
  team_size?: number
  technologies_used?: string[]
  outcomes?: string[]
  project_url?: string
  client_type?: string
  created_at: string
  updated_at: string
}

export interface AwardHonor {
  id: string
  designer_profile_id: string
  title?: string
  issuing_organization?: string
  issue_date?: string
  description?: string
  award_url?: string
  created_at: string
  updated_at: string
}

export interface Publication {
  id: string
  designer_profile_id: string
  title?: string
  publication_type?: string
  publisher?: string
  publication_date?: string
  description?: string
  publication_url?: string
  co_authors?: string[]
  created_at: string
  updated_at: string
}

export interface ProfessionalReference {
  id: string
  designer_profile_id: string
  reference_name?: string
  title?: string
  company?: string
  relationship?: string
  email?: string
  phone?: string
  linkedin_url?: string
  reference_text?: string
  created_at: string
  updated_at: string
}

export interface VolunteerExperience {
  id: string
  designer_profile_id: string
  organization_name?: string
  role?: string
  start_date?: string
  end_date?: string
  description?: string
  skills_used?: string[]
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  client_id: string
  title: string
  description: string
  requirements?: Record<string, unknown>
  budget_range?: string
  timeline?: string
  status: ProjectStatus
  custom_fields?: Record<string, unknown>
  selected_candidates?: string[]
  created_at: string
  updated_at: string
}

export interface Offer {
  id: string
  project_id: string
  designer_id: string
  status: OfferStatus
  custom_message?: string
  sent_at: string
  responded_at?: string
  created_at: string
  updated_at: string
}

export interface Evaluation {
  id: string
  project_id: string
  designer_id: string
  client_rating?: number // 1-5
  client_feedback?: string
  work_samples?: string[]
  created_at: string
}

export interface UpdateRequest {
  id: string
  designer_id: string
  requested_by: string
  message: string
  status: UpdateRequestStatus
  created_at: string
  completed_at?: string
}

// Additional types for MVP required fields validation
export interface MVPRequiredFields {
  title: string
  phone: string
  email: string
  availability: string
  portfolio_url: string
  cv_file_url: string
  professional_summary: string
  total_experience_years: number
  skills: Array<{
    skill_name: string
    category: SkillCategory
    proficiency_level: number
  }>
  work_experiences: Array<{
    company_name: string
    industry: string
  }>
  languages: Array<{
    language_name: string
    proficiency_level: number
  }>
}

// Database response types with relationships
export interface DesignerProfileWithDetails extends DesignerProfile {
  work_experiences?: WorkExperience[]
  educations?: Education[]
  skills?: Skill[]
  certifications?: Certification[]
  languages?: Language[]
  cv_projects?: CVProject[]
  awards_honors?: AwardHonor[]
  publications?: Publication[]
  professional_references?: ProfessionalReference[]
  volunteer_experiences?: VolunteerExperience[]
}

export interface ProjectWithOffers extends Project {
  offers?: Offer[]
  evaluations?: Evaluation[]
}

export interface OfferWithDetails extends Offer {
  project?: Project
  designer?: DesignerProfile
}