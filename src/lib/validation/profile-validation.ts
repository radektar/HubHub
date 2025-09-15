// Main profile validation logic for HubHub MVP requirements

import { ParsedCVData } from '@/lib/cv-parser/types'
import { 
  VALIDATION_MESSAGES
} from './constants'
import {
  calculateTotalExperience,
  validateCoreField,
  countValidProficiencies,
  getAllSkills,
  getAllLanguages
} from './validation-utils'
import type { 
  MVPData, 
  ValidationResult, 
  ProfileCompletionStatus, 
  FieldValidationStatus,
  ValidationWeights
} from './types'

// Default validation weights
const DEFAULT_VALIDATION_WEIGHTS: ValidationWeights = {
  coreProfile: 0.5,      // 50% - Most important
  workExperience: 0.2,   // 20% - Important for matching
  skills: 0.2,           // 20% - Important for matching
  languages: 0.1         // 10% - Nice to have
}

/**
 * Main validation function for MVP requirements
 * This replaces the validateParsedData function from ParsingResults component
 */
export function validateProfileCompletion(
  data: ParsedCVData, 
  mvpData?: MVPData,
  weights: ValidationWeights = DEFAULT_VALIDATION_WEIGHTS
): ValidationResult {
  const missingFields: string[] = []
  const suggestions: string[] = []
  const fieldValidation: Record<string, FieldValidationStatus> = {}
  
  // Get detailed completion status
  const completionStatus = getProfileCompletionStatus(data, mvpData)
  
  // Validate core profile fields
  const coreValidation = validateCoreProfile(data, mvpData)
  Object.assign(fieldValidation, coreValidation.fieldValidation)
  missingFields.push(...coreValidation.missingFields)
  suggestions.push(...coreValidation.suggestions)
  
  // Validate work experience
  const workValidation = validateWorkExperience(data)
  Object.assign(fieldValidation, workValidation.fieldValidation)
  missingFields.push(...workValidation.missingFields)
  suggestions.push(...workValidation.suggestions)
  
  // Validate skills
  const skillsValidation = validateSkills(data, mvpData)
  Object.assign(fieldValidation, skillsValidation.fieldValidation)
  missingFields.push(...skillsValidation.missingFields)
  suggestions.push(...skillsValidation.suggestions)
  
  // Validate languages
  const languagesValidation = validateLanguages(data, mvpData)
  Object.assign(fieldValidation, languagesValidation.fieldValidation)
  missingFields.push(...languagesValidation.missingFields)
  suggestions.push(...languagesValidation.suggestions)
  
  // Calculate weighted completion percentage
  const completionPercentage = calculateWeightedCompletion(completionStatus, weights)
  
  // Determine overall validation result
  const isValid = missingFields.length === 0
  const severity = isValid ? 'complete' : (completionPercentage > 70 ? 'warning' : 'error')
  
  return {
    isValid,
    missingFields,
    suggestions,
    completionPercentage,
    fieldValidation,
    severity
  }
}

/**
 * Validate core profile fields
 */
function validateCoreProfile(data: ParsedCVData, mvpData?: MVPData) {
  const missingFields: string[] = []
  const suggestions: string[] = []
  const fieldValidation: Record<string, FieldValidationStatus> = {}
  
  // Validate basic personal information
  const nameValidation = validateCoreField('name', data.personal.name)
  fieldValidation.name = nameValidation
  if (!nameValidation.isValid) {
    missingFields.push('name')
    suggestions.push(nameValidation.message)
  }
  
  const emailValidation = validateCoreField('email', data.personal.email)
  fieldValidation.email = emailValidation
  if (!emailValidation.isValid) {
    missingFields.push('email')
    suggestions.push(emailValidation.message)
  }
  
  const phoneValidation = validateCoreField('phone', data.personal.phone)
  fieldValidation.phone = phoneValidation
  if (!phoneValidation.isValid) {
    missingFields.push('phone')
    suggestions.push(phoneValidation.message)
  }
  
  // Validate MVP specific fields
  const titleValidation = validateCoreField('title', mvpData?.title)
  fieldValidation.title = titleValidation
  if (!titleValidation.isValid) {
    missingFields.push('title')
    suggestions.push(titleValidation.message)
  }
  
  const availabilityValidation = validateCoreField('availability', mvpData?.availability)
  fieldValidation.availability = availabilityValidation
  if (!availabilityValidation.isValid) {
    missingFields.push('availability')
    suggestions.push(availabilityValidation.message)
  }
  
  // Portfolio URL (check both portfolio and linkedin)
  const portfolioUrl = data.personal.portfolio || data.personal.linkedin
  const portfolioValidation = validateCoreField('portfolio_url', portfolioUrl)
  fieldValidation.portfolio_url = portfolioValidation
  if (!portfolioValidation.isValid) {
    missingFields.push('portfolio_url')
    suggestions.push(portfolioValidation.message)
  }
  
  const summaryValidation = validateCoreField('professional_summary', data.personal.summary)
  fieldValidation.professional_summary = summaryValidation
  if (!summaryValidation.isValid) {
    missingFields.push('professional_summary')
    suggestions.push(summaryValidation.message)
  }
  
  // Total experience years (use MVP data or calculate from work experience)
  const totalExperience = mvpData?.totalExperienceYears || calculateTotalExperience(data.workExperience)
  const experienceValidation = validateCoreField('total_experience_years', totalExperience)
  fieldValidation.total_experience_years = experienceValidation
  if (!experienceValidation.isValid || totalExperience === 0) {
    missingFields.push('total_experience_years')
    suggestions.push(experienceValidation.message || VALIDATION_MESSAGES.EXPERIENCE_YEARS_REQUIRED)
  }
  
  return { missingFields, suggestions, fieldValidation }
}

/**
 * Validate work experience requirements
 */
function validateWorkExperience(data: ParsedCVData) {
  const missingFields: string[] = []
  const suggestions: string[] = []
  const fieldValidation: Record<string, FieldValidationStatus> = {}
  
  // Check if has work experience
  if (!data.workExperience || data.workExperience.length === 0) {
    missingFields.push('work_experience')
    suggestions.push(VALIDATION_MESSAGES.WORK_EXPERIENCE_REQUIRED)
    fieldValidation.work_experience = {
      isValid: false,
      message: VALIDATION_MESSAGES.WORK_EXPERIENCE_REQUIRED,
      severity: 'error',
      required: true
    }
    return { missingFields, suggestions, fieldValidation }
  }
  
  // Check if all work experiences have required fields
  const missingCompanies = data.workExperience.some(exp => !exp.company)
  const missingIndustries = data.workExperience.some(exp => !exp.industry)
  
  if (missingCompanies) {
    missingFields.push('work_experience_companies')
    suggestions.push(VALIDATION_MESSAGES.WORK_EXPERIENCE_COMPANY_REQUIRED)
  }
  
  if (missingIndustries) {
    missingFields.push('work_experience_industries')
    suggestions.push(VALIDATION_MESSAGES.WORK_EXPERIENCE_INDUSTRY_REQUIRED)
  }
  
  fieldValidation.work_experience = {
    isValid: !missingCompanies && !missingIndustries,
    message: missingCompanies || missingIndustries ? 
      'Please complete all work experience details' : '',
    severity: 'error',
    required: true
  }
  
  return { missingFields, suggestions, fieldValidation }
}

/**
 * Validate skills requirements
 */
function validateSkills(data: ParsedCVData, mvpData?: MVPData) {
  const missingFields: string[] = []
  const suggestions: string[] = []
  const fieldValidation: Record<string, FieldValidationStatus> = {}
  
  // Get all skills
  const allSkills = getAllSkills(data.skills)
  
  // Check if has skills
  if (allSkills.length === 0) {
    missingFields.push('skills')
    suggestions.push(VALIDATION_MESSAGES.SKILLS_REQUIRED)
    fieldValidation.skills = {
      isValid: false,
      message: VALIDATION_MESSAGES.SKILLS_REQUIRED,
      severity: 'error',
      required: true
    }
    return { missingFields, suggestions, fieldValidation }
  }
  
  // Check proficiency ratings
  const skillsProficiency = mvpData?.skillsProficiency || {}
  const validProficiencies = countValidProficiencies(skillsProficiency)
  const hasAllProficiencies = validProficiencies >= allSkills.length
  
  if (!hasAllProficiencies) {
    missingFields.push('skills_proficiency')
    suggestions.push(VALIDATION_MESSAGES.SKILLS_PROFICIENCY_REQUIRED)
  }
  
  fieldValidation.skills = {
    isValid: hasAllProficiencies,
    message: hasAllProficiencies ? '' : VALIDATION_MESSAGES.SKILLS_PROFICIENCY_REQUIRED,
    severity: 'error',
    required: true
  }
  
  return { missingFields, suggestions, fieldValidation }
}

/**
 * Validate languages requirements
 */
function validateLanguages(data: ParsedCVData, mvpData?: MVPData) {
  const missingFields: string[] = []
  const suggestions: string[] = []
  const fieldValidation: Record<string, FieldValidationStatus> = {}
  
  // Get all languages
  const allLanguages = getAllLanguages(data.skills)
  
  // Check if has languages
  if (allLanguages.length === 0) {
    missingFields.push('languages')
    suggestions.push(VALIDATION_MESSAGES.LANGUAGES_REQUIRED)
    fieldValidation.languages = {
      isValid: false,
      message: VALIDATION_MESSAGES.LANGUAGES_REQUIRED,
      severity: 'error',
      required: true
    }
    return { missingFields, suggestions, fieldValidation }
  }
  
  // Check proficiency ratings
  const languagesProficiency = mvpData?.languagesProficiency || {}
  const validProficiencies = countValidProficiencies(languagesProficiency)
  const hasAllProficiencies = validProficiencies >= allLanguages.length
  
  if (!hasAllProficiencies) {
    missingFields.push('languages_proficiency')
    suggestions.push(VALIDATION_MESSAGES.LANGUAGES_PROFICIENCY_REQUIRED)
  }
  
  fieldValidation.languages = {
    isValid: hasAllProficiencies,
    message: hasAllProficiencies ? '' : VALIDATION_MESSAGES.LANGUAGES_PROFICIENCY_REQUIRED,
    severity: 'error',
    required: true
  }
  
  return { missingFields, suggestions, fieldValidation }
}

/**
 * Get detailed profile completion status
 */
export function getProfileCompletionStatus(data: ParsedCVData, mvpData?: MVPData): ProfileCompletionStatus {
  // Core profile completion
  const coreFields = {
    name: !!data.personal.name,
    email: !!data.personal.email,
    phone: !!data.personal.phone,
    title: !!mvpData?.title,
    availability: !!mvpData?.availability,
    portfolio_url: !!(data.personal.portfolio || data.personal.linkedin),
    professional_summary: !!data.personal.summary,
    total_experience_years: !!(mvpData?.totalExperienceYears || calculateTotalExperience(data.workExperience))
  }
  
  const coreCompleted = Object.values(coreFields).filter(Boolean).length
  const coreTotal = Object.keys(coreFields).length
  
  // Work experience completion
  const hasWorkExperience = data.workExperience && data.workExperience.length > 0
  const hasIndustries = hasWorkExperience && data.workExperience.every(exp => exp.industry)
  const workCompleted = (hasWorkExperience ? 1 : 0) + (hasIndustries ? 1 : 0)
  const workTotal = 2
  
  // Skills completion
  const allSkills = getAllSkills(data.skills)
  const hasSkills = allSkills.length > 0
  const skillsProficiency = mvpData?.skillsProficiency || {}
  const validSkillProficiencies = countValidProficiencies(skillsProficiency)
  const hasProficiency = validSkillProficiencies >= allSkills.length && allSkills.length > 0
  const skillsCompleted = (hasSkills ? 1 : 0) + (hasProficiency ? 1 : 0)
  const skillsTotal = 2
  
  // Languages completion
  const allLanguages = getAllLanguages(data.skills)
  const hasLanguages = allLanguages.length > 0
  const languagesProficiency = mvpData?.languagesProficiency || {}
  const validLanguageProficiencies = countValidProficiencies(languagesProficiency)
  const hasLanguageProficiency = validLanguageProficiencies >= allLanguages.length && allLanguages.length > 0
  const languagesCompleted = (hasLanguages ? 1 : 0) + (hasLanguageProficiency ? 1 : 0)
  const languagesTotal = 2
  
  // Overall completion
  const totalCompleted = coreCompleted + workCompleted + skillsCompleted + languagesCompleted
  const totalFields = coreTotal + workTotal + skillsTotal + languagesTotal
  const percentage = Math.round((totalCompleted / totalFields) * 100)
  
  return {
    coreProfile: {
      completed: coreCompleted,
      total: coreTotal,
      fields: coreFields
    },
    workExperience: {
      completed: workCompleted,
      total: workTotal,
      hasExperience: hasWorkExperience,
      hasIndustries: hasIndustries
    },
    skills: {
      completed: skillsCompleted,
      total: skillsTotal,
      hasSkills: hasSkills,
      hasProficiency: hasProficiency
    },
    languages: {
      completed: languagesCompleted,
      total: languagesTotal,
      hasLanguages: hasLanguages,
      hasProficiency: hasLanguageProficiency
    },
    overall: {
      completedFields: totalCompleted,
      totalFields: totalFields,
      percentage: percentage
    }
  }
}

/**
 * Calculate weighted completion percentage
 */
function calculateWeightedCompletion(
  status: ProfileCompletionStatus, 
  weights: ValidationWeights
): number {
  const corePercentage = (status.coreProfile.completed / status.coreProfile.total) * 100
  const workPercentage = (status.workExperience.completed / status.workExperience.total) * 100
  const skillsPercentage = (status.skills.completed / status.skills.total) * 100
  const languagesPercentage = (status.languages.completed / status.languages.total) * 100
  
  const weightedPercentage = 
    (corePercentage * weights.coreProfile) +
    (workPercentage * weights.workExperience) +
    (skillsPercentage * weights.skills) +
    (languagesPercentage * weights.languages)
  
  return Math.round(weightedPercentage)
}
