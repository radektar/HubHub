// CV Parser Types - Structured data extraction from CVs

export interface ParsedCVData {
  // Personal Information
  personal: {
    name?: string
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    portfolio?: string
    summary?: string
  }
  
  // Work Experience
  workExperience: Array<{
    jobTitle?: string
    company?: string
    industry?: string
    location?: string
    startDate?: string
    endDate?: string
    isCurrent?: boolean
    description?: string
    achievements?: string[]
    technologies?: string[]
  }>
  
  // Education
  education: Array<{
    degree?: string
    institution?: string
    location?: string
    startDate?: string
    endDate?: string
    gpa?: string
    honors?: string[]
    relevantCoursework?: string[]
  }>
  
  // Skills
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
  
  // Additional Sections
  certifications?: Array<{
    name?: string
    issuer?: string
    date?: string
    url?: string
  }>
  
  projects?: Array<{
    name?: string
    description?: string
    technologies?: string[]
    url?: string
    duration?: string
  }>
  
  awards?: Array<{
    title?: string
    issuer?: string
    date?: string
    description?: string
  }>
  
  publications?: Array<{
    title?: string
    publisher?: string
    date?: string
    url?: string
  }>
  
  // Metadata
  rawText: string
  confidence: number // 0-1 score for parsing confidence
  errors: string[]
}

export interface CVParsingOptions {
  extractImages?: boolean
  strictParsing?: boolean
  includeRawText?: boolean
}

export interface CVParserResult {
  success: boolean
  data?: ParsedCVData
  error?: string
  processingTime: number
}
