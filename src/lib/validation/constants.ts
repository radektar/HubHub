// Validation constants and rules for HubHub profile completion

// Design titles available for selection
export const DESIGN_TITLES = [
  'UX Designer',
  'UI Designer', 
  'Product Designer',
  'UX/UI Designer',
  'Visual Designer',
  'Interaction Designer',
  'Service Designer',
  'Design Lead',
  'Senior Designer',
  'Junior Designer',
  'Design Manager',
  'Creative Director',
  'Other'
] as const

// Availability options
export const AVAILABILITY_OPTIONS = [
  'Available',
  'Busy',
  'Not Available'
] as const

// Industry categories for work experience
export const INDUSTRIES = [
  'Automotive', 'Energy', 'IT', 'Finance', 'Insurance', 'Banking', 
  'Healthcare', 'Startups', 'Blockchain/Crypto', 'AdTech/MarTech', 
  'Manufacturing', 'Construction', 'eCommerce', 'Education', 
  'Transport/Logistics', 'Agriculture', 'Tourism/Hospitality', 
  'Telecommunications', 'Green Tech', 'HR', 'Other'
] as const

// MVP required field definitions
export const MVP_REQUIRED_FIELDS = {
  // Core profile fields (8 fields)
  CORE_PROFILE: [
    'name',
    'email', 
    'phone',
    'title',
    'availability',
    'portfolio_url',
    'professional_summary',
    'total_experience_years'
  ],
  
  // Work experience requirements (2 validation points)
  WORK_EXPERIENCE: [
    'has_work_experience',
    'work_experience_industries'
  ],
  
  // Skills requirements (2 validation points) 
  SKILLS: [
    'has_skills',
    'skills_proficiency'
  ],
  
  // Languages requirements (2 validation points)
  LANGUAGES: [
    'has_languages', 
    'languages_proficiency'
  ]
} as const

// Total required validation points
export const TOTAL_VALIDATION_POINTS = 
  MVP_REQUIRED_FIELDS.CORE_PROFILE.length +
  MVP_REQUIRED_FIELDS.WORK_EXPERIENCE.length +
  MVP_REQUIRED_FIELDS.SKILLS.length +
  MVP_REQUIRED_FIELDS.LANGUAGES.length // = 14 total points

// Minimum requirements for profile completion
export const MINIMUM_REQUIREMENTS = {
  WORK_EXPERIENCES: 1,
  SKILLS: 1,
  LANGUAGES: 1,
  PROFICIENCY_MIN: 1,
  PROFICIENCY_MAX: 5,
  EXPERIENCE_YEARS_MIN: 0,
  EXPERIENCE_YEARS_MAX: 50
} as const

// Validation message templates
export const VALIDATION_MESSAGES = {
  // Core profile messages
  NAME_REQUIRED: 'Please ensure your full name appears at the top of the CV',
  EMAIL_REQUIRED: 'Please ensure your email address is clearly visible in the CV',
  EMAIL_INVALID: 'Please provide a valid email address',
  PHONE_REQUIRED: 'Please include your phone number in the contact information',
  PHONE_INVALID: 'Please provide a valid phone number',
  TITLE_REQUIRED: 'Please select your professional title/position',
  AVAILABILITY_REQUIRED: 'Please specify your availability status',
  PORTFOLIO_REQUIRED: 'Please provide your portfolio URL or LinkedIn profile',
  PORTFOLIO_INVALID: 'Please provide a valid URL (e.g., https://portfolio.com or www.linkedin.com/in/username)',
  SUMMARY_REQUIRED: 'Please add a professional summary',
  SUMMARY_TOO_SHORT: 'Professional summary should be at least 50 characters',
  EXPERIENCE_YEARS_REQUIRED: 'Please specify your total years of experience',
  EXPERIENCE_YEARS_INVALID: 'Experience years must be between 0 and 50',
  
  // Work experience messages
  WORK_EXPERIENCE_REQUIRED: 'Please include at least one work experience',
  WORK_EXPERIENCE_COMPANY_REQUIRED: 'Please provide company name for all work experiences',
  WORK_EXPERIENCE_INDUSTRY_REQUIRED: 'Please specify the industry for all work experiences',
  WORK_EXPERIENCE_DATES_INVALID: 'Please provide valid start and end dates',
  
  // Skills messages
  SKILLS_REQUIRED: 'Please include at least one skill',
  SKILLS_PROFICIENCY_REQUIRED: 'Please rate your proficiency level for all skills (1-5 scale)',
  SKILLS_PROFICIENCY_INVALID: 'Proficiency levels must be between 1 and 5',
  
  // Languages messages
  LANGUAGES_REQUIRED: 'Please include at least one language',
  LANGUAGES_PROFICIENCY_REQUIRED: 'Please rate your proficiency level for all languages (1-5 scale)',
  LANGUAGES_PROFICIENCY_INVALID: 'Language proficiency levels must be between 1 and 5'
} as const

// Field display names for user-friendly messages
export const FIELD_DISPLAY_NAMES = {
  name: 'Full Name',
  email: 'Email Address',
  phone: 'Phone Number',
  title: 'Professional Title',
  availability: 'Availability Status',
  portfolio_url: 'Portfolio/LinkedIn URL',
  professional_summary: 'Professional Summary',
  total_experience_years: 'Total Experience Years',
  work_experience: 'Work Experience',
  skills: 'Skills',
  languages: 'Languages'
} as const
