// AI-Powered CV Parser using Google Gemini

import { GoogleGenerativeAI } from '@google/generative-ai'
import { ParsedCVData } from './types'

export class AIParser {
  private gemini: GoogleGenerativeAI
  
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables')
    }
    this.gemini = new GoogleGenerativeAI(apiKey)
  }

  /**
   * Parse CV text using Gemini AI for intelligent data extraction
   */
  async parseWithAI(rawText: string, retryCount = 0): Promise<ParsedCVData> {
    const maxRetries = 3
    const retryDelay = 2000 // 2 seconds base delay
    
    try {
      console.log('🤖 Starting AI-powered CV parsing...')
      
      // Use gemini-2.5-flash-lite - lightweight model available in free tier (January 2026)
      // Old models (1.0, 1.5) have been deprecated
      const model = this.gemini.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
      console.log('📡 Using model: gemini-2.5-flash-lite')
      
      const prompt = this.buildStructuredPrompt(rawText)
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      console.log('🧠 AI response received, parsing JSON...')
      console.log('📝 Response length:', text.length)
      
      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error('⚠️ No JSON found in response. Full response:', text.substring(0, 500))
        throw new Error('No valid JSON found in AI response')
      }
      
      const parsedData = JSON.parse(jsonMatch[0]) as ParsedCVData
      
      console.log('✅ AI parsing completed successfully')
      console.log('📊 Parsed data summary:', {
        name: parsedData.personal?.name || 'N/A',
        email: parsedData.personal?.email || 'N/A',
        workExp: parsedData.workExperience?.length || 0,
        skills: Object.keys(parsedData.skills || {}).length
      })
      
      return parsedData
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const isQuotaError = errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Quota exceeded')
      
      // Retry on quota errors with exponential backoff
      if (isQuotaError && retryCount < maxRetries) {
        const delay = retryDelay * Math.pow(2, retryCount) // Exponential backoff
        console.log(`⏳ Quota error detected. Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.parseWithAI(rawText, retryCount + 1)
      }
      
      console.error('❌ AI parsing failed:', errorMessage)
      throw new Error(`AI parsing failed: ${errorMessage}`)
    }
  }

  /**
   * Build a structured prompt for CV parsing
   */
  private buildStructuredPrompt(rawText: string): string {
    return `
You are an expert CV/Resume parser. Extract structured information from the following CV text and return it as valid JSON.

IMPORTANT: Return ONLY valid JSON, no additional text or formatting.

Required JSON structure:
{
  "personal": {
    "name": "string",
    "email": "string", 
    "phone": "string",
    "location": "string",
    "portfolio": "string",
    "linkedin": "string",
    "summary": "string"
  },
  "workExperience": [
    {
      "jobTitle": "string",
      "company": "string", 
      "industry": "string",
      "startDate": "string",
      "endDate": "string",
      "description": "string",
      "achievements": ["string"]
    }
  ],
  "skills": {
    "technical": ["string"],
    "design": ["string"], 
    "tools": ["string"],
    "soft": ["string"]
  },
  "languages": [
    {
      "name": "string",
      "proficiency": "string"
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "year": "string",
      "gpa": "string"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string", 
      "year": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "url": "string"
    }
  ]
}

Instructions:
1. Extract ALL available information from the CV text
2. If information is missing, use empty string "" or empty array []
3. Infer industry from company context when possible
4. Categorize skills appropriately (technical, design, tools, soft)
5. Extract years of experience and calculate total experience
6. Be thorough - don't miss any details

CV Text to parse:
${rawText}

Return valid JSON only:
`
  }

  /**
   * Enhanced parsing with fallback to regex extraction
   */
  async parseWithFallback(rawText: string): Promise<ParsedCVData> {
    try {
      // Try AI parsing first
      return await this.parseWithAI(rawText)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.log('⚠️ AI parsing failed, using fallback regex extraction')
      console.log('📋 Error details:', errorMessage.substring(0, 200))
      console.log('📝 Text length for regex parsing:', rawText.length)
      
      // Fallback to improved regex parsing
      const regexResult = this.parseWithRegex(rawText)
      console.log('📊 Regex parsing results:', {
        name: regexResult.personal?.name || 'N/A',
        email: regexResult.personal?.email || 'N/A',
        workExp: regexResult.workExperience?.length || 0,
        skills: Object.keys(regexResult.skills || {}).length
      })
      
      return regexResult
    }
  }

  /**
   * Improved regex-based parsing as fallback
   */
  private parseWithRegex(text: string): ParsedCVData {
    return {
      personal: {
        name: this.extractName(text),
        email: this.extractEmail(text),
        phone: this.extractPhone(text),
        location: this.extractLocation(text),
        portfolio: this.extractPortfolio(text),
        linkedin: this.extractLinkedIn(text),
        summary: this.extractSummary(text)
      },
      workExperience: this.extractWorkExperience(text),
      skills: {
        ...this.extractSkills(text),
        languages: this.extractLanguages(text)
      },
      education: this.extractEducation(text),
      certifications: this.extractCertifications(text),
      projects: this.extractProjects(text),
      rawText: text,
      confidence: 0.7,
      errors: []
    }
  }

  // Enhanced regex extraction methods
  private extractName(text: string): string {
    // Look for name at the beginning of document
    const lines = text.split('\n').filter(line => line.trim())
    const firstLine = lines[0]?.trim()
    
    // Skip common headers and get actual name
    if (firstLine && !firstLine.match(/(resume|cv|curriculum|vitae)/i)) {
      return firstLine
    }
    
    return lines[1]?.trim() || ''
  }

  private extractEmail(text: string): string {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    const match = text.match(emailRegex)
    return match?.[0] || ''
  }

  private extractPhone(text: string): string {
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g
    const match = text.match(phoneRegex)
    return match?.[0] || ''
  }

  private extractLocation(text: string): string {
    const locationPatterns = [
      /(?:Location|Address|Based in|Located in):\s*([^\n]+)/i,
      /([A-Za-z\s]+,\s*[A-Z]{2}(?:\s+\d{5})?)/g
    ]
    
    for (const pattern of locationPatterns) {
      const match = text.match(pattern)
      if (match) return match[1]?.trim() || ''
    }
    return ''
  }

  private extractPortfolio(text: string): string {
    const portfolioRegex = /(?:portfolio|website|site):\s*(https?:\/\/[^\s]+)/i
    const match = text.match(portfolioRegex)
    return match?.[1] || ''
  }

  private extractLinkedIn(text: string): string {
    const linkedinRegex = /(?:linkedin|linked-in):\s*(https?:\/\/[^\s]+)/i
    const match = text.match(linkedinRegex)
    return match?.[1] || ''
  }

  private extractSummary(text: string): string {
    const summaryPatterns = [
      /(?:PROFESSIONAL SUMMARY|SUMMARY|PROFILE|ABOUT|OVERVIEW)\s*\n([\s\S]*?)(?=\n[A-Z\s]+\n|$)/i,
      /(?:PROFESSIONAL SUMMARY|SUMMARY|PROFILE|ABOUT|OVERVIEW)\s*([\s\S]*?)(?=\n[A-Z\s]+\n|$)/i
    ]
    
    for (const pattern of summaryPatterns) {
      const match = text.match(pattern)
      if (match) return match[1]?.trim() || ''
    }
    return ''
  }

  private extractWorkExperience(text: string): Array<{
    jobTitle: string
    company: string
    industry: string
    startDate: string
    endDate: string
    description: string
    achievements: string[]
  }> {
    const experiences = []
    const workSection = text.match(/(?:WORK EXPERIENCE|EXPERIENCE|EMPLOYMENT)\s*([\s\S]*?)(?=\n(?:EDUCATION|SKILLS|PROJECTS)|$)/i)?.[1] || ''
    
    // Enhanced pattern to match job entries
    const jobPattern = /([^\n]+?)\s+at\s+([^\n]+?)\s*\n([^\n]*?(?:\d{4}|\w+\s+\d{4}).*?)\s*\n([\s\S]*?)(?=\n[^\n]+\s+at\s+|$)/g
    
    let match
    while ((match = jobPattern.exec(workSection)) !== null) {
      experiences.push({
        jobTitle: match[1]?.trim() || '',
        company: match[2]?.trim() || '',
        industry: this.inferIndustry(match[2]?.trim() || ''),
        startDate: this.extractDate(match[3], 'start'),
        endDate: this.extractDate(match[3], 'end'),
        description: match[4]?.trim() || '',
        achievements: this.extractAchievements(match[4] || '')
      })
    }
    
    return experiences
  }

  private extractSkills(text: string): {
    technical: string[]
    design: string[]
    tools: string[]
    soft: string[]
  } {
    const skillsSection = text.match(/(?:SKILLS|TECHNICAL SKILLS|COMPETENCIES)\s*([\s\S]*?)(?=\n[A-Z\s]+\n|$)/i)?.[1] || ''
    
    return {
      technical: this.extractSkillCategory(skillsSection, ['Technical', 'Programming', 'Development']),
      design: this.extractSkillCategory(skillsSection, ['Design', 'Creative', 'Visual']),
      tools: this.extractSkillCategory(skillsSection, ['Tools', 'Software', 'Applications']),
      soft: this.extractSkillCategory(skillsSection, ['Soft', 'Personal', 'Communication'])
    }
  }

  private extractSkillCategory(text: string, categories: string[]): string[] {
    for (const category of categories) {
      const regex = new RegExp(`${category}:\\s*([^\\n]+)`, 'i')
      const match = text.match(regex)
      if (match?.[1]) {
        return match[1].split(',').map(skill => skill.trim())
      }
    }
    return []
  }

  private extractLanguages(text: string): Array<{ name: string; proficiency: string }> {
    const languagesSection = text.match(/(?:LANGUAGES)\s*([\s\S]*?)(?=\n[A-Z\s]+\n|$)/i)?.[1] || ''
    const languages = []
    
    const langPattern = /([A-Za-z]+):\s*(Native|Fluent|Advanced|Intermediate|Basic|Beginner)/gi
    let match
    while ((match = langPattern.exec(languagesSection)) !== null) {
      languages.push({
        name: match[1].trim(),
        proficiency: match[2].trim()
      })
    }
    
    return languages
  }

  private extractEducation(text: string): Array<{
    degree: string
    institution: string
    year: string
    gpa: string
  }> {
    const educationSection = text.match(/(?:EDUCATION)\s*([\s\S]*?)(?=\n[A-Z\s]+\n|$)/i)?.[1] || ''
    const education = []
    
    const eduPattern = /([^\n]+)\n([^\n]+)\n?([^\n]*(?:\d{4})[^\n]*)/g
    let match
    while ((match = eduPattern.exec(educationSection)) !== null) {
      education.push({
        degree: match[1]?.trim() || '',
        institution: match[2]?.trim() || '',
        year: this.extractYear(match[3] || ''),
        gpa: this.extractGPA(match[3] || '')
      })
    }
    
    return education
  }

  private extractCertifications(text: string): Array<{
    name: string
    issuer: string
    year: string
  }> {
    const certSection = text.match(/(?:CERTIFICATIONS|CERTIFICATES)\s*([\s\S]*?)(?=\n[A-Z\s]+\n|$)/i)?.[1] || ''
    const certifications = []
    
    const certPattern = /([^\n-]+?)\s*-\s*(\d{4})/g
    let match
    while ((match = certPattern.exec(certSection)) !== null) {
      certifications.push({
        name: match[1]?.trim() || '',
        issuer: '',
        year: match[2] || ''
      })
    }
    
    return certifications
  }

  private extractProjects(_text: string): Array<{
    name: string
    description: string
    technologies: string[]
    url: string
  }> {
    // Basic project extraction - can be enhanced
    // TODO: Implement project extraction from CV text
    // Parameter prefixed with _ to indicate intentionally unused
    return []
  }

  // Helper methods
  private inferIndustry(company: string): string {
    const industryKeywords = {
      'Technology': ['tech', 'software', 'digital', 'app', 'platform'],
      'Healthcare': ['health', 'medical', 'hospital', 'clinic'],
      'Finance': ['bank', 'financial', 'investment', 'capital'],
      'Retail': ['retail', 'shop', 'store', 'commerce'],
      'Education': ['university', 'school', 'education', 'academic']
    }
    
    const lowerCompany = company.toLowerCase()
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => lowerCompany.includes(keyword))) {
        return industry
      }
    }
    return ''
  }

  private extractDate(dateStr: string, type: 'start' | 'end'): string {
    const dates = dateStr.match(/\w+\s+\d{4}|\d{4}/g) || []
    return type === 'start' ? dates[0] || '' : dates[1] || dates[0] || ''
  }

  private extractAchievements(description: string): string[] {
    return description.split('\n')
      .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
      .map(line => line.replace(/^[•-]\s*/, '').trim())
      .filter(line => line.length > 0)
  }

  private extractYear(text: string): string {
    const yearMatch = text.match(/\d{4}/)
    return yearMatch?.[0] || ''
  }

  private extractGPA(text: string): string {
    const gpaMatch = text.match(/GPA:\s*(\d+\.?\d*)/i)
    return gpaMatch?.[1] || ''
  }
}

