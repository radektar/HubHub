// Profile Completion API Types

export interface ProfileCompletionRequest {
  // Core profile data (from ParsingResults component)
  personal: {
    name?: string
    email: string
    phone: string
    location?: string
    portfolio?: string
    linkedin?: string
    summary?: string
  }
  
  // MVP-specific data (from enhanced ParsingResults)
  mvpData: {
    title: string
    availability: string
    totalExperienceYears: number
    skillsProficiency: Record<string, number> // skill_name -> proficiency_level (1-5)
    languagesProficiency: Record<string, number> // language_name -> proficiency_level (1-5)
  }
  
  // Work experience with industry categorization
  workExperience: Array<{
    jobTitle?: string
    company?: string
    industry: string // Required for MVP
    location?: string
    startDate?: string
    endDate?: string
    isCurrent?: boolean
    description?: string
    achievements?: string[]
    technologies?: string[]
  }>
  
  // Skills with categories and proficiency
  skills: {
    technical?: string[]
    design?: string[]
    tools?: string[]
    soft?: string[]
    languages?: Array<{
      name: string
      proficiency?: string
    }>
  }
  
  // Education (optional)
  education?: Array<{
    degree?: string
    institution?: string
    location?: string
    startDate?: string
    endDate?: string
    gpa?: string
    honors?: string[]
    relevantCoursework?: string[]
  }>
  
  // CV file information
  cvFileUrl?: string
}

export interface ProfileCompletionResponse {
  success: boolean
  profileId?: string
  isComplete?: boolean
  completionPercentage?: number
  missingFields?: string[]
  error?: string
}

// Database insertion types
export interface DesignerProfileInsert {
  user_id: string
  name?: string
  title: string
  phone: string
  email: string
  availability: string
  portfolio_url: string
  cv_file_url?: string
  professional_summary: string
  total_experience_years: number
  location?: string
  is_profile_complete?: boolean
}

export interface WorkExperienceInsert {
  designer_profile_id: string
  job_title?: string
  company_name: string
  industry: string
  location?: string
  start_date?: string
  end_date?: string
  is_current?: boolean
  description?: string
  achievements?: string[]
  technologies_used?: string[]
}

export interface SkillInsert {
  designer_profile_id: string
  skill_name: string
  category: 'technical' | 'design' | 'tool' | 'soft'
  proficiency_level: number
}

export interface LanguageInsert {
  designer_profile_id: string
  language_name: string
  proficiency_level: number
}

export interface EducationInsert {
  designer_profile_id: string
  institution_name?: string
  degree_type?: string
  field_of_study?: string
  start_date?: string
  end_date?: string
  gpa?: number
  honors?: string[]
  relevant_coursework?: string[]
}
