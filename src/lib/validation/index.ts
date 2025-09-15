// Main export file for HubHub validation system

// Main validation functions
export { 
  validateProfileCompletion, 
  getProfileCompletionStatus 
} from './profile-validation'

// Validation utilities
export {
  calculateTotalExperience,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  isValidProficiency,
  isValidExperienceYears,
  validateCoreField,
  countValidProficiencies,
  getAllSkills,
  getAllLanguages
} from './validation-utils'

// Constants
export {
  DESIGN_TITLES,
  AVAILABILITY_OPTIONS,
  INDUSTRIES,
  MVP_REQUIRED_FIELDS,
  TOTAL_VALIDATION_POINTS,
  MINIMUM_REQUIREMENTS,
  VALIDATION_MESSAGES,
  FIELD_DISPLAY_NAMES
} from './constants'

// Types
export type {
  MVPData,
  ValidationResult,
  FieldValidationStatus,
  ValidationSeverity,
  ProfileCompletionStatus,
  ValidationWeights
} from './types'

// Note: DEFAULT_VALIDATION_WEIGHTS is internal to profile-validation.ts
