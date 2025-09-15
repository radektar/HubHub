// Validation types and interfaces for HubHub profile completion

export interface MVPData {
  title: string
  availability: string
  totalExperienceYears: number
  skillsProficiency: Record<string, number>
  languagesProficiency: Record<string, number>
}

export interface ValidationResult {
  isValid: boolean
  missingFields: string[]
  suggestions: string[]
  completionPercentage: number
  fieldValidation: Record<string, FieldValidationStatus>
  severity: ValidationSeverity
}

export interface FieldValidationStatus {
  isValid: boolean
  message: string
  severity: 'error' | 'warning' | 'info'
  required: boolean
}

export type ValidationSeverity = 'error' | 'warning' | 'complete'

export interface ProfileCompletionStatus {
  coreProfile: {
    completed: number
    total: number
    fields: Record<string, boolean>
  }
  workExperience: {
    completed: number
    total: number
    hasExperience: boolean
    hasIndustries: boolean
  }
  skills: {
    completed: number
    total: number
    hasSkills: boolean
    hasProficiency: boolean
  }
  languages: {
    completed: number
    total: number
    hasLanguages: boolean
    hasProficiency: boolean
  }
  overall: {
    completedFields: number
    totalFields: number
    percentage: number
  }
}

// Weight system for different field categories
export interface ValidationWeights {
  coreProfile: number
  workExperience: number
  skills: number
  languages: number
}

// Note: DEFAULT_VALIDATION_WEIGHTS moved to profile-validation.ts to avoid circular imports
