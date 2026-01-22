// CV Text Analysis and Data Extraction

import { ParsedCVData } from './types'

export class CVAnalyzer {
  private text: string
  private lines: string[]

  constructor(text: string) {
    this.text = text
    this.lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  }

  /**
   * Main parsing method
   */
  public parse(): ParsedCVData {
    const startTime = Date.now()
    const errors: string[] = []

    try {
      const personal = this.extractPersonalInfo()
      const workExperience = this.extractWorkExperience()
      const education = this.extractEducation()
      const skills = this.extractSkills()
      const certifications = this.extractCertifications()
      const projects = this.extractProjects()
      const awards = this.extractAwards()
      const publications = this.extractPublications()

      const confidence = this.calculateConfidence(personal, workExperience, education, skills)
      // Processing time tracked for potential future use (prefixed with _ to indicate intentionally unused)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _processingTime = Date.now() - startTime

      return {
        personal,
        workExperience,
        education,
        skills,
        certifications,
        projects,
        awards,
        publications,
        rawText: this.text,
        confidence,
        errors
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown parsing error')
      
      return {
        personal: {},
        workExperience: [],
        education: [],
        skills: { technical: [], design: [], tools: [], soft: [], languages: [] },
        rawText: this.text,
        confidence: 0,
        errors
      }
    }
  }

  /**
   * Extract personal information
   */
  private extractPersonalInfo() {
    const personal: Record<string, unknown> = {}
    
    // Extract email
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    const emails = this.text.match(emailRegex)
    if (emails && emails.length > 0) {
      personal.email = emails[0]
    }

    // Extract phone numbers
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
    const phones = this.text.match(phoneRegex)
    if (phones && phones.length > 0) {
      personal.phone = phones[0].replace(/\s+/g, ' ').trim()
    }

    // Extract LinkedIn
    const linkedinRegex = /(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)([\w-]+)/gi
    const linkedin = this.text.match(linkedinRegex)
    if (linkedin && linkedin.length > 0) {
      personal.linkedin = linkedin[0]
    }

    // Extract portfolio/website
    const portfolioRegex = /(?:portfolio|website|site):\s*(https?:\/\/[^\s]+)/gi
    const portfolio = this.text.match(portfolioRegex)
    if (portfolio && portfolio.length > 0) {
      personal.portfolio = portfolio[0].split(':')[1].trim()
    }

    // Extract name (usually first non-email line)
    const firstLines = this.lines.slice(0, 5)
    for (const line of firstLines) {
      if (!line.includes('@') && !line.match(/\d{3,}/) && line.length > 3 && line.length < 50) {
        const words = line.split(/\s+/)
        if (words.length >= 2 && words.length <= 4) {
          personal.name = line
          break
        }
      }
    }

    // Extract summary/objective
    const summaryKeywords = ['summary', 'objective', 'profile', 'about', 'overview']
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].toLowerCase()
      if (summaryKeywords.some(keyword => line.includes(keyword))) {
        const summaryLines = []
        for (let j = i + 1; j < Math.min(i + 10, this.lines.length); j++) {
          const nextLine = this.lines[j]
          if (this.isSectionHeader(nextLine)) break
          summaryLines.push(nextLine)
        }
        personal.summary = summaryLines.join(' ').trim()
        break
      }
    }

    return personal
  }

  /**
   * Extract work experience
   */
  private extractWorkExperience(): Array<{
    jobTitle?: string
    company?: string
    location?: string
    startDate?: string
    endDate?: string
    isCurrent?: boolean
    description?: string
    achievements?: string[]
    technologies?: string[]
  }> {
    const experiences: Record<string, unknown>[] = []
    const experienceKeywords = ['experience', 'employment', 'work history', 'career', 'professional']
    
    let startIndex = -1
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].toLowerCase()
      if (experienceKeywords.some(keyword => line.includes(keyword))) {
        startIndex = i + 1
        break
      }
    }

    if (startIndex === -1) return experiences

    let currentExperience: Record<string, unknown> = {}
    
    for (let i = startIndex; i < this.lines.length; i++) {
      const line = this.lines[i]
      
      // Stop if we hit another major section
      if (this.isSectionHeader(line) && !line.toLowerCase().includes('experience')) {
        if (Object.keys(currentExperience).length > 0) {
          experiences.push(currentExperience)
        }
        break
      }

      // Check if this looks like a job title/company line
      if (this.looksLikeJobEntry(line)) {
        if (Object.keys(currentExperience).length > 0) {
          experiences.push(currentExperience)
        }
        currentExperience = this.parseJobLine(line)
      } else if (Object.keys(currentExperience).length > 0) {
        // Add to description or parse dates
        if (this.containsDate(line)) {
          const dates = this.extractDates(line)
          if (dates.start) currentExperience.startDate = dates.start
          if (dates.end) currentExperience.endDate = dates.end
          currentExperience.isCurrent = dates.isCurrent
        } else {
          currentExperience.description = (currentExperience.description || '') + ' ' + line
        }
      }
    }

    if (Object.keys(currentExperience).length > 0) {
      experiences.push(currentExperience)
    }

    return experiences.map(exp => ({
      jobTitle: exp.jobTitle as string | undefined,
      company: exp.company as string | undefined,
      location: exp.location as string | undefined,
      startDate: exp.startDate as string | undefined,
      endDate: exp.endDate as string | undefined,
      isCurrent: exp.isCurrent as boolean | undefined,
      description: typeof exp.description === 'string' ? exp.description.trim() : exp.description as string | undefined,
      achievements: exp.achievements as string[] | undefined,
      technologies: exp.technologies as string[] | undefined
    }))
  }

  /**
   * Extract education
   */
  private extractEducation() {
    const educations: Record<string, unknown>[] = []
    const educationKeywords = ['education', 'academic', 'university', 'college', 'degree']
    
    let startIndex = -1
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].toLowerCase()
      if (educationKeywords.some(keyword => line.includes(keyword))) {
        startIndex = i + 1
        break
      }
    }

    if (startIndex === -1) return educations

    let currentEducation: Record<string, unknown> = {}
    
    for (let i = startIndex; i < this.lines.length; i++) {
      const line = this.lines[i]
      
      if (this.isSectionHeader(line) && !line.toLowerCase().includes('education')) {
        if (Object.keys(currentEducation).length > 0) {
          educations.push(currentEducation)
        }
        break
      }

      if (this.looksLikeEducationEntry(line)) {
        if (Object.keys(currentEducation).length > 0) {
          educations.push(currentEducation)
        }
        currentEducation = this.parseEducationLine(line)
      } else if (Object.keys(currentEducation).length > 0) {
        if (this.containsDate(line)) {
          const dates = this.extractDates(line)
          if (dates.start) currentEducation.startDate = dates.start
          if (dates.end) currentEducation.endDate = dates.end
        }
      }
    }

    if (Object.keys(currentEducation).length > 0) {
      educations.push(currentEducation)
    }

    return educations
  }

  /**
   * Extract skills
   */
  private extractSkills() {
    const skills = {
      technical: [] as string[],
      design: [] as string[],
      tools: [] as string[],
      soft: [] as string[],
      languages: [] as Array<{ name: string; proficiency?: string }>
    }

    const skillsKeywords = ['skills', 'technologies', 'tools', 'competencies']
    const designSkills = ['ui', 'ux', 'design', 'figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'indesign']
    const technicalSkills = ['javascript', 'python', 'java', 'react', 'angular', 'vue', 'node', 'sql', 'html', 'css']
    const toolSkills = ['git', 'docker', 'kubernetes', 'aws', 'azure', 'jenkins', 'jira', 'confluence']

    let startIndex = -1
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].toLowerCase()
      if (skillsKeywords.some(keyword => line.includes(keyword))) {
        startIndex = i + 1
        break
      }
    }

    if (startIndex !== -1) {
      for (let i = startIndex; i < this.lines.length; i++) {
        const line = this.lines[i]
        
        if (this.isSectionHeader(line)) break

        // Parse skills from the line
        const skillsInLine = this.extractSkillsFromLine(line)
        skillsInLine.forEach(skill => {
          const skillLower = skill.toLowerCase()
          
          if (designSkills.some(ds => skillLower.includes(ds))) {
            skills.design.push(skill)
          } else if (technicalSkills.some(ts => skillLower.includes(ts))) {
            skills.technical.push(skill)
          } else if (toolSkills.some(ts => skillLower.includes(ts))) {
            skills.tools.push(skill)
          } else {
            skills.soft.push(skill)
          }
        })
      }
    }

    return skills
  }

  /**
   * Extract certifications
   */
  private extractCertifications() {
    const certifications: Record<string, unknown>[] = []
    const certKeywords = ['certification', 'certificate', 'certified', 'license']
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].toLowerCase()
      if (certKeywords.some(keyword => line.includes(keyword))) {
        const cert: Record<string, unknown> = { name: this.lines[i] }
        
        // Look for dates in the same or next line
        if (this.containsDate(line)) {
          const dates = this.extractDates(line)
          cert.date = dates.end || dates.start
        }
        
        certifications.push(cert)
      }
    }

    return certifications
  }

  /**
   * Extract projects
   */
  private extractProjects() {
    const projects: Record<string, unknown>[] = []
    const projectKeywords = ['project', 'portfolio']
    
    let startIndex = -1
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].toLowerCase()
      if (projectKeywords.some(keyword => line.includes(keyword))) {
        startIndex = i + 1
        break
      }
    }

    if (startIndex !== -1) {
      for (let i = startIndex; i < this.lines.length; i++) {
        const line = this.lines[i]
        if (this.isSectionHeader(line)) break
        
        if (line.length > 10) {
          projects.push({ name: line, description: line })
        }
      }
    }

    return projects
  }

  /**
   * Extract awards
   */
  private extractAwards() {
    const awards: Record<string, unknown>[] = []
    const awardKeywords = ['award', 'honor', 'recognition', 'achievement']
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].toLowerCase()
      if (awardKeywords.some(keyword => line.includes(keyword))) {
        awards.push({ title: this.lines[i] })
      }
    }

    return awards
  }

  /**
   * Extract publications
   */
  private extractPublications() {
    const publications: Record<string, unknown>[] = []
    const pubKeywords = ['publication', 'paper', 'article', 'journal']
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].toLowerCase()
      if (pubKeywords.some(keyword => line.includes(keyword))) {
        publications.push({ title: this.lines[i] })
      }
    }

    return publications
  }

  // Helper methods
  private isSectionHeader(line: string): boolean {
    const headers = ['experience', 'education', 'skills', 'projects', 'awards', 'publications', 'certifications']
    const lineLower = line.toLowerCase()
    return headers.some(header => lineLower.includes(header)) && line.length < 50
  }

  private looksLikeJobEntry(line: string): boolean {
    // Look for patterns like "Job Title at Company" or "Job Title - Company"
    return (line.includes(' at ') || line.includes(' - ') || line.includes(' | ')) && 
           line.length > 10 && line.length < 100
  }

  private looksLikeEducationEntry(line: string): boolean {
    const eduKeywords = ['university', 'college', 'institute', 'school', 'bachelor', 'master', 'phd', 'degree']
    return eduKeywords.some(keyword => line.toLowerCase().includes(keyword))
  }

  private parseJobLine(line: string): Record<string, unknown> {
    const parts = line.split(/\s+(?:at|@|-|\|)\s+/)
    return {
      jobTitle: parts[0]?.trim(),
      company: parts[1]?.trim()
    }
  }

  private parseEducationLine(line: string): Record<string, unknown> {
    return {
      degree: line.includes('bachelor') || line.includes('master') || line.includes('phd') ? line : undefined,
      institution: line
    }
  }

  private containsDate(line: string): boolean {
    const dateRegex = /\b\d{4}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{4}\b/gi
    return dateRegex.test(line)
  }

  private extractDates(line: string) {
    const yearRegex = /\b(19|20)\d{2}\b/g
    const years = line.match(yearRegex)
    const isCurrent = /present|current|now/gi.test(line)
    
    return {
      start: years?.[0],
      end: years?.[1] || (isCurrent ? 'present' : years?.[0]),
      isCurrent
    }
  }

  private extractSkillsFromLine(line: string): string[] {
    // Split by common delimiters
    return line.split(/[,;|•·]/)
      .map(skill => skill.trim())
      .filter(skill => skill.length > 1 && skill.length < 30)
  }

  private calculateConfidence(personal: Record<string, unknown>, workExperience: Record<string, unknown>[], education: Record<string, unknown>[], skills: Record<string, unknown>): number {
    let score = 0
    const maxScore = 10

    // Personal info scoring
    if (personal.name) score += 2
    if (personal.email) score += 2
    if (personal.phone) score += 1

    // Experience scoring
    if (workExperience.length > 0) score += 2
    if (workExperience.some(exp => exp.jobTitle && exp.company)) score += 1

    // Education scoring
    if (education.length > 0) score += 1

    // Skills scoring
    const skillsTyped = skills as { technical?: string[]; design?: string[]; tools?: string[]; soft?: string[] }
    const totalSkills = (skillsTyped.technical?.length || 0) + (skillsTyped.design?.length || 0) + 
                       (skillsTyped.tools?.length || 0) + (skillsTyped.soft?.length || 0)
    if (totalSkills > 0) score += 1

    return Math.min(score / maxScore, 1)
  }
}
