// Database types based on TECHNICAL_APPROACH.md schema

export interface User {
  id: string
  email: string
  role: 'designer' | 'client' | 'admin'
  created_at: string
  updated_at: string
}

export interface DesignerProfile {
  id: string
  user_id: string
  name?: string
  title: string
  professional_summary: string
  phone: string
  email: string
  location?: string
  availability: string
  portfolio_url: string
  cv_file_url: string
  photo_url?: string
  total_experience_years: number
  rating?: number
  is_profile_complete: boolean
  survey_data?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface WorkExperience {
  id: string
  designer_profile_id: string
  job_title?: string
  company_name: string
  company_size?: string
  industry: string
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

export interface Skill {
  id: string
  designer_profile_id: string
  skill_name: string
  category: 'technical' | 'soft' | 'design' | 'tool'
  proficiency_level: number // 1-5
  years_of_experience?: number
  last_used_date?: string
  is_endorsed?: boolean
  endorsement_count?: number
  created_at: string
  updated_at: string
}

export interface Language {
  id: string
  designer_profile_id: string
  language_name: string
  proficiency_level: number // 1-5
  is_native?: boolean
  certification_name?: string
  created_at: string
  updated_at: string
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
    category: string
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
