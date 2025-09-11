// Main CV Parser - Combines text extraction and intelligent analysis

import { TextExtractor } from './text-extractor'
import { CVAnalyzer } from './cv-analyzer'
import { CVParserResult, CVParsingOptions, ParsedCVData } from './types'

export class CVParser {
  /**
   * Parse CV from file buffer
   */
  static async parseCV(
    buffer: Buffer, 
    mimeType: string, 
    options: CVParsingOptions = {}
  ): Promise<CVParserResult> {
    const startTime = Date.now()

    try {
      // Step 1: Extract text from the file
      const extractedText = await TextExtractor.extractText(buffer, mimeType)
      
      if (!extractedText.content || extractedText.content.trim().length === 0) {
        return {
          success: false,
          error: 'No text content found in the CV file',
          processingTime: Date.now() - startTime
        }
      }

      // Step 2: Analyze and parse the text
      const analyzer = new CVAnalyzer(extractedText.content)
      const parsedData = analyzer.parse()

      // Step 3: Enhance with metadata
      const enhancedData: ParsedCVData = {
        ...parsedData,
        rawText: options.includeRawText !== false ? parsedData.rawText : '',
      }

      return {
        success: true,
        data: enhancedData,
        processingTime: Date.now() - startTime
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Validate parsed CV data quality
   */
  static validateParsedData(data: ParsedCVData): {
    isValid: boolean
    missingFields: string[]
    suggestions: string[]
  } {
    const missingFields: string[] = []
    const suggestions: string[] = []

    // Check required personal information
    if (!data.personal.email) {
      missingFields.push('email')
      suggestions.push('Please ensure your email address is clearly visible in the CV')
    }

    if (!data.personal.name) {
      missingFields.push('name')
      suggestions.push('Please ensure your full name appears at the top of the CV')
    }

    if (!data.personal.phone) {
      missingFields.push('phone')
      suggestions.push('Please include your phone number in the contact information')
    }

    // Check work experience
    if (data.workExperience.length === 0) {
      missingFields.push('work_experience')
      suggestions.push('Please include your work experience with company names and job titles')
    }

    // Check skills
    const totalSkills = (data.skills.technical?.length || 0) + 
                       (data.skills.design?.length || 0) + 
                       (data.skills.tools?.length || 0)
    
    if (totalSkills === 0) {
      missingFields.push('skills')
      suggestions.push('Please include a skills section with your technical and design capabilities')
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      suggestions
    }
  }

  /**
   * Map parsed CV data to database schema format
   */
  static mapToDatabase(parsedData: ParsedCVData, userId: string) {
    return {
      // Designer profile data
      designerProfile: {
        user_id: userId,
        name: parsedData.personal.name,
        email: parsedData.personal.email || '',
        phone: parsedData.personal.phone || '',
        location: parsedData.personal.location,
        portfolio_url: parsedData.personal.portfolio || parsedData.personal.linkedin || '',
        professional_summary: parsedData.personal.summary || '',
        total_experience_years: this.calculateTotalExperience(parsedData.workExperience),
        // Note: title, availability, cv_file_url will need to be set separately
      },

      // Work experiences
      workExperiences: parsedData.workExperience.map(exp => ({
        job_title: exp.jobTitle,
        company_name: exp.company || '',
        location: exp.location,
        start_date: exp.startDate ? new Date(exp.startDate) : null,
        end_date: exp.endDate && exp.endDate !== 'present' ? new Date(exp.endDate) : null,
        is_current: exp.isCurrent || false,
        description: exp.description,
        technologies_used: exp.technologies || [],
        // Note: industry will need to be mapped/categorized
        industry: 'Other' // Default, should be updated based on company/role
      })),

      // Education
      educations: parsedData.education.map(edu => ({
        institution_name: edu.institution,
        degree_type: edu.degree,
        start_date: edu.startDate ? new Date(edu.startDate) : null,
        end_date: edu.endDate ? new Date(edu.endDate) : null,
        gpa: edu.gpa ? parseFloat(edu.gpa) : null,
        honors: edu.honors || []
      })),

      // Skills
      skills: [
        ...(parsedData.skills.technical?.map(skill => ({
          skill_name: skill,
          category: 'technical' as const,
          proficiency_level: 3 // Default, should be updated by user
        })) || []),
        ...(parsedData.skills.design?.map(skill => ({
          skill_name: skill,
          category: 'design' as const,
          proficiency_level: 3
        })) || []),
        ...(parsedData.skills.tools?.map(skill => ({
          skill_name: skill,
          category: 'tool' as const,
          proficiency_level: 3
        })) || []),
        ...(parsedData.skills.soft?.map(skill => ({
          skill_name: skill,
          category: 'soft' as const,
          proficiency_level: 3
        })) || [])
      ],

      // Languages
      languages: parsedData.skills.languages?.map(lang => ({
        language_name: lang.name,
        proficiency_level: this.mapLanguageProficiency(lang.proficiency),
        is_native: lang.proficiency?.toLowerCase().includes('native') || false
      })) || [],

      // Certifications
      certifications: parsedData.certifications?.map(cert => ({
        certification_name: cert.name,
        issuing_organization: cert.issuer,
        issue_date: cert.date ? new Date(cert.date) : null,
        credential_url: cert.url
      })) || [],

      // Projects
      cvProjects: parsedData.projects?.map(project => ({
        project_name: project.name,
        description: project.description,
        technologies_used: project.technologies || [],
        project_url: project.url,
        duration_months: this.parseDuration(project.duration)
      })) || [],

      // Awards
      awards: parsedData.awards?.map(award => ({
        title: award.title,
        issuing_organization: award.issuer,
        issue_date: award.date ? new Date(award.date) : null,
        description: award.description
      })) || [],

      // Publications
      publications: parsedData.publications?.map(pub => ({
        title: pub.title,
        publisher: pub.publisher,
        publication_date: pub.date ? new Date(pub.date) : null,
        publication_url: pub.url
      })) || []
    }
  }

  // Helper methods
  private static calculateTotalExperience(workExperience: Record<string, unknown>[]): number {
    if (workExperience.length === 0) return 0

    let totalMonths = 0
    for (const exp of workExperience) {
      if (exp.startDate && typeof exp.startDate === 'string') {
        const start = new Date(exp.startDate)
        const end = exp.endDate && exp.endDate !== 'present' && typeof exp.endDate === 'string' ? new Date(exp.endDate) : new Date()
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
        totalMonths += Math.max(months, 0)
      }
    }

    return Math.round(totalMonths / 12 * 10) / 10 // Round to 1 decimal place
  }

  private static mapLanguageProficiency(proficiency?: string): number {
    if (!proficiency) return 3

    const prof = proficiency.toLowerCase()
    if (prof.includes('native') || prof.includes('fluent')) return 5
    if (prof.includes('advanced') || prof.includes('proficient')) return 4
    if (prof.includes('intermediate')) return 3
    if (prof.includes('basic') || prof.includes('beginner')) return 2
    if (prof.includes('elementary')) return 1

    return 3 // Default
  }

  private static parseDuration(duration?: string): number | null {
    if (!duration) return null

    const months = duration.match(/(\d+)\s*month/i)
    if (months) return parseInt(months[1])

    const years = duration.match(/(\d+)\s*year/i)
    if (years) return parseInt(years[1]) * 12

    return null
  }
}

// Export types and main class
export * from './types'
export { TextExtractor } from './text-extractor'
export { CVAnalyzer } from './cv-analyzer'
