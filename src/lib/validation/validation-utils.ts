// Validation utility functions for HubHub profile completion

import { MINIMUM_REQUIREMENTS, VALIDATION_MESSAGES } from './constants'
import type { FieldValidationStatus } from './types'

/**
 * Calculate total experience years from work experience array
 */
export function calculateTotalExperience(workExperience: unknown[]): number {
  if (!workExperience || workExperience.length === 0) return 0
  
  let totalMonths = 0
  const currentDate = new Date()
  
  workExperience.forEach(exp => {
    if (exp && typeof exp === 'object' && 'startDate' in exp && exp.startDate) {
      const startDate = new Date(exp.startDate as string)
      const endDate = ('isCurrent' in exp && exp.isCurrent) ? currentDate : 
                      ('endDate' in exp && exp.endDate ? new Date(exp.endDate as string) : currentDate)
      
      if (startDate && endDate && endDate > startDate) {
        const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (endDate.getMonth() - startDate.getMonth())
        totalMonths += monthsDiff
      }
    }
  })
  
  return Math.round(totalMonths / 12 * 10) / 10 // Round to 1 decimal
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number format (basic validation)
 */
export function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')
  // Accept phone numbers with 7-15 digits
  return digitsOnly.length >= 7 && digitsOnly.length <= 15
}

/**
 * Validate URL format (flexible - accepts URLs with or without protocol)
 */
export function isValidUrl(url: string): boolean {
  if (!url || url.trim() === '') return false
  
  // Remove whitespace
  const trimmedUrl = url.trim()
  
  // Check if it's a valid URL pattern
  const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i
  const linkedinPattern = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w-]+\/?$/i
  
  // Accept LinkedIn URLs specifically
  if (linkedinPattern.test(trimmedUrl)) {
    return true
  }
  
  // Try with protocol if missing
  try {
    // If no protocol, try adding https://
    const testUrl = trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`
    new URL(testUrl)
    return true
  } catch {
    // Fallback to regex pattern matching
    return urlPattern.test(trimmedUrl)
  }
}

/**
 * Validate proficiency level (1-5 scale)
 */
export function isValidProficiency(level: number): boolean {
  return level >= MINIMUM_REQUIREMENTS.PROFICIENCY_MIN && 
         level <= MINIMUM_REQUIREMENTS.PROFICIENCY_MAX
}

/**
 * Validate experience years
 */
export function isValidExperienceYears(years: number): boolean {
  return years >= MINIMUM_REQUIREMENTS.EXPERIENCE_YEARS_MIN && 
         years <= MINIMUM_REQUIREMENTS.EXPERIENCE_YEARS_MAX
}

/**
 * Create field validation status
 */
export function createFieldValidation(
  isValid: boolean,
  message: string,
  severity: 'error' | 'warning' | 'info' = 'error',
  required: boolean = true
): FieldValidationStatus {
  return {
    isValid,
    message,
    severity,
    required
  }
}

/**
 * Validate core profile field
 */
export function validateCoreField(
  fieldName: string,
  value: unknown,
  required: boolean = true
): FieldValidationStatus {
  // Handle empty/null values
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    if (required) {
      return createFieldValidation(false, getRequiredMessage(fieldName), 'error', true)
    }
    return createFieldValidation(true, '', 'info', false)
  }

  // Field-specific validation
  switch (fieldName) {
    case 'email':
      if (typeof value === 'string' && !isValidEmail(value)) {
        return createFieldValidation(false, VALIDATION_MESSAGES.EMAIL_INVALID, 'error', required)
      }
      break
      
    case 'phone':
      if (typeof value === 'string' && !isValidPhone(value)) {
        return createFieldValidation(false, VALIDATION_MESSAGES.PHONE_INVALID, 'error', required)
      }
      break
      
    case 'portfolio_url':
      if (typeof value === 'string' && !isValidUrl(value)) {
        return createFieldValidation(false, VALIDATION_MESSAGES.PORTFOLIO_INVALID, 'error', required)
      }
      break
      
    case 'professional_summary':
      if (typeof value === 'string' && value.length < 50) {
        return createFieldValidation(false, VALIDATION_MESSAGES.SUMMARY_TOO_SHORT, 'warning', required)
      }
      break
      
    case 'total_experience_years':
      const years = typeof value === 'string' ? parseFloat(value) : (typeof value === 'number' ? value : 0)
      if (!isValidExperienceYears(years)) {
        return createFieldValidation(false, VALIDATION_MESSAGES.EXPERIENCE_YEARS_INVALID, 'error', required)
      }
      break
  }

  return createFieldValidation(true, '', 'info', required)
}

/**
 * Get required field message
 */
function getRequiredMessage(fieldName: string): string {
  const messageMap: Record<string, string> = {
    name: VALIDATION_MESSAGES.NAME_REQUIRED,
    email: VALIDATION_MESSAGES.EMAIL_REQUIRED,
    phone: VALIDATION_MESSAGES.PHONE_REQUIRED,
    title: VALIDATION_MESSAGES.TITLE_REQUIRED,
    availability: VALIDATION_MESSAGES.AVAILABILITY_REQUIRED,
    portfolio_url: VALIDATION_MESSAGES.PORTFOLIO_REQUIRED,
    professional_summary: VALIDATION_MESSAGES.SUMMARY_REQUIRED,
    total_experience_years: VALIDATION_MESSAGES.EXPERIENCE_YEARS_REQUIRED
  }
  
  return messageMap[fieldName] || `Please provide ${fieldName.replace('_', ' ')}`
}

/**
 * Count valid proficiency ratings
 */
export function countValidProficiencies(proficiencyMap: Record<string, number>): number {
  return Object.values(proficiencyMap).filter(level => isValidProficiency(level)).length
}

/**
 * Get all skills from skills object
 */
export function getAllSkills(skills: unknown): string[] {
  if (!skills) return []
  
  const allSkills: string[] = []
  
  // Collect skills from all categories
  if (skills && typeof skills === 'object') {
    Object.entries(skills).forEach(([category, skillList]) => {
      if (category !== 'languages' && Array.isArray(skillList)) {
        allSkills.push(...(skillList as string[]))
      }
    })
  }
  
  return allSkills
}

/**
 * Get all languages from skills object
 */
export function getAllLanguages(skills: unknown): string[] {
  if (!skills || typeof skills !== 'object' || !('languages' in skills)) return []
  
  const languages = (skills as { languages?: unknown }).languages
  if (!Array.isArray(languages)) return []
  
  return languages.map((lang: unknown) => 
    typeof lang === 'string' ? lang : 
    (lang && typeof lang === 'object' && 'name' in lang ? (lang as { name: string }).name : '')
  ).filter(Boolean)
}
