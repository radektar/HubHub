// API Route for Designer Profile Completion
// Handles saving enhanced parsing results to database with MVP field validation

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateProfileCompletion } from '@/lib/validation'
import type { 
  ProfileCompletionRequest, 
  ProfileCompletionResponse,
  DesignerProfileInsert,
  WorkExperienceInsert,
  SkillInsert,
  LanguageInsert,
  // EducationInsert // Unused import
} from '@/types/profile-completion.types'

// Helper function to parse date strings and handle special cases like "Present"
function parseDateString(dateStr?: string): string | null {
  if (!dateStr) return null
  
  // Handle "Present", "Current", etc.
  const lowerStr = dateStr.toLowerCase().trim()
  if (lowerStr === 'present' || lowerStr === 'current' || lowerStr === 'now') {
    return null
  }
  
  // Try to parse the date
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      // If direct parsing fails, try some common formats
      const cleanStr = dateStr.replace(/[^\w\s]/g, ' ').trim()
      const parsedDate = new Date(cleanStr)
      if (isNaN(parsedDate.getTime())) {
        console.warn(`Could not parse date: ${dateStr}`)
        return null
      }
      return parsedDate.toISOString().split('T')[0] // Return YYYY-MM-DD format
    }
    return date.toISOString().split('T')[0] // Return YYYY-MM-DD format
  } catch (error) {
    console.warn(`Error parsing date: ${dateStr}`, error)
    return null
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 Profile Completion API called')
  
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message)
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Verify user is a designer
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (userError || userData?.role !== 'designer') {
      console.log('❌ User not authorized as designer:', userError?.message)
      return NextResponse.json(
        { success: false, error: 'Designer role required' },
        { status: 403 }
      )
    }
    
    console.log('✅ User authenticated as designer:', user.id)
    
    // Parse request data
    const profileData: ProfileCompletionRequest = await request.json()
    console.log('📋 Profile data received for user:', user.id)
    
    // Validate the profile completion using our validation system
    // Convert ProfileCompletionRequest to ParsedCVData format for validation
    const parsedDataForValidation = {
      personal: profileData.personal,
      workExperience: profileData.workExperience,
      skills: profileData.skills,
      education: profileData.education || [],
      rawText: '',
      confidence: 1.0,
      errors: []
    }
    const validationResult = validateProfileCompletion(parsedDataForValidation, profileData.mvpData)
    console.log('🔍 Validation result:', {
      isValid: validationResult.isValid,
      percentage: validationResult.completionPercentage,
      missingCount: validationResult.missingFields.length
    })
    
    // Note: Supabase handles transactions automatically for related operations
    
    try {
      // 1. Create or update designer profile
      const portfolioUrl = profileData.personal.portfolio || profileData.personal.linkedin || ''
      
      const designerProfileData: DesignerProfileInsert = {
        user_id: user.id,
        name: profileData.personal.name,
        title: profileData.mvpData.title,
        phone: profileData.personal.phone,
        email: profileData.personal.email,
        availability: profileData.mvpData.availability,
        portfolio_url: portfolioUrl,
        cv_file_url: profileData.cvFileUrl || '',
        professional_summary: profileData.personal.summary || '',
        total_experience_years: Math.round(profileData.mvpData.totalExperienceYears),
        location: profileData.personal.location,
        is_profile_complete: validationResult.isValid
      }
      
      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('designer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      let profileResult
      let profileError
      
      if (existingProfile) {
        // Update existing profile (exclude user_id from update)
        const { user_id, ...updateData } = designerProfileData
        const { data, error } = await supabase
          .from('designer_profiles')
          .update(updateData)
          .eq('user_id', user.id)
          .select('id')
          .single()
        profileResult = data
        profileError = error
        console.log('🔄 Updated existing profile:', existingProfile.id)
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('designer_profiles')
          .insert(designerProfileData)
          .select('id')
          .single()
        profileResult = data
        profileError = error
        console.log('✨ Created new profile')
      }
      
      if (profileError) {
        console.error('❌ Profile operation failed:', {
          error: profileError,
          data: designerProfileData,
          userId: user.id,
          isUpdate: !!existingProfile
        })
        throw new Error(`Profile ${existingProfile ? 'update' : 'creation'} failed: ${profileError.message}`)
      }
      
      if (!profileResult) {
        throw new Error('Profile creation failed - no result returned')
      }
      
      const profileId = profileResult.id
      console.log('✅ Designer profile saved:', profileId)
      
      // 2. Clear existing related data (for updates)
      await Promise.all([
        supabase.from('work_experiences').delete().eq('designer_profile_id', profileId),
        supabase.from('skills').delete().eq('designer_profile_id', profileId),
        supabase.from('languages').delete().eq('designer_profile_id', profileId),
        supabase.from('educations').delete().eq('designer_profile_id', profileId) // Corrected: 'educations' is the actual table name
      ])
      
      // 3. Insert work experiences with industry categorization
      if (profileData.workExperience && profileData.workExperience.length > 0) {
        const workExperiences: WorkExperienceInsert[] = profileData.workExperience
          .filter(exp => exp.company && exp.industry) // Only include entries with required MVP fields
          .map(exp => {
            // Parse dates properly - handle "Present" and other date formats
            const startDate = parseDateString(exp.startDate)
            const endDate = parseDateString(exp.endDate)
            const isCurrent = Boolean(exp.isCurrent || (exp.endDate && exp.endDate.toLowerCase().includes('present')))
            
            return {
              designer_profile_id: profileId,
              job_title: exp.jobTitle,
              company_name: exp.company!,
              industry: exp.industry,
              location: exp.location,
              start_date: startDate || undefined,
              end_date: isCurrent ? undefined : (endDate || undefined), // Set end_date to undefined if current position
              is_current: isCurrent,
              description: exp.description,
              achievements: exp.achievements || [],
              technologies_used: exp.technologies || []
            }
          })
        
        if (workExperiences.length > 0) {
          const { error: workError } = await supabase
            .from('work_experiences')
            .insert(workExperiences)
          
          if (workError) {
            throw new Error(`Work experience insertion failed: ${workError.message}`)
          }
          
          console.log('✅ Work experiences saved:', workExperiences.length)
        }
      }
      
      // 4. Insert skills with proficiency levels
      const skillsToInsert: SkillInsert[] = []
      
      // Process each skill category
      if (profileData.skills) {
        const categories = [
          { key: 'technical', category: 'technical' as const },
          { key: 'design', category: 'design' as const },
          { key: 'tools', category: 'tool' as const },
          { key: 'soft', category: 'soft' as const }
        ]
        
        categories.forEach(({ key, category }) => {
          const skills = profileData.skills[key as keyof typeof profileData.skills] as string[] | undefined
          if (skills && Array.isArray(skills)) {
            skills.forEach(skillName => {
              const proficiencyLevel = profileData.mvpData.skillsProficiency[skillName] || 3 // Default to 3 if not specified
              skillsToInsert.push({
                designer_profile_id: profileId,
                skill_name: skillName,
                category: category,
                proficiency_level: proficiencyLevel
              })
            })
          }
        })
      }
      
      if (skillsToInsert.length > 0) {
        const { error: skillsError } = await supabase
          .from('skills')
          .insert(skillsToInsert)
        
        if (skillsError) {
          throw new Error(`Skills insertion failed: ${skillsError.message}`)
        }
        
        console.log('✅ Skills saved:', skillsToInsert.length)
      }
      
      // 5. Insert languages with proficiency levels
      const languagesToInsert: LanguageInsert[] = []
      
      // Process languages from skills.languages array
      if (profileData.skills.languages && Array.isArray(profileData.skills.languages)) {
        profileData.skills.languages.forEach(lang => {
          const proficiencyLevel = profileData.mvpData.languagesProficiency[lang.name] || 3 // Default to 3 if not specified
          languagesToInsert.push({
            designer_profile_id: profileId,
            language_name: lang.name,
            proficiency_level: proficiencyLevel
          })
        })
      }
      
      // Also check for additional languages from MVP data
      Object.entries(profileData.mvpData.languagesProficiency).forEach(([langName, proficiency]) => {
        // Only add if not already in the array
        if (!languagesToInsert.find(l => l.language_name === langName)) {
          languagesToInsert.push({
            designer_profile_id: profileId,
            language_name: langName,
            proficiency_level: proficiency
          })
        }
      })
      
      if (languagesToInsert.length > 0) {
        const { error: languagesError } = await supabase
          .from('languages')
          .insert(languagesToInsert)
        
        if (languagesError) {
          throw new Error(`Languages insertion failed: ${languagesError.message}`)
        }
        
        console.log('✅ Languages saved:', languagesToInsert.length)
      }
      
      // 6. Insert education (optional)
      if (profileData.education && profileData.education.length > 0) {
        const educationToInsert = profileData.education.map(edu => ({
          designer_profile_id: profileId,
          institution_name: edu.institution,
          degree_type: edu.degree,
          field_of_study: undefined, // Not in current parsing structure
          start_date: parseDateString(edu.startDate) || undefined,
          end_date: parseDateString(edu.endDate) || undefined,
          additional_info: {
            gpa: edu.gpa,
            honors: edu.honors || [],
            relevant_coursework: edu.relevantCoursework || []
          }
        }))
        
        const { error: educationError } = await supabase
          .from('educations') // Corrected: 'educations' is the actual table name
          .insert(educationToInsert)
        
        if (educationError) {
          console.warn('⚠️ Education insertion failed (non-critical):', educationError.message)
        } else {
          console.log('✅ Education saved:', educationToInsert.length)
        }
      }
      
      // 7. The database triggers will automatically update is_profile_complete flag
      // based on the check_profile_completion function
      
      console.log('✅ Profile completion saved successfully')
      
      const response: ProfileCompletionResponse = {
        success: true,
        profileId: profileId,
        isComplete: validationResult.isValid,
        completionPercentage: validationResult.completionPercentage,
        missingFields: validationResult.missingFields
      }
      
      return NextResponse.json(response)
      
    } catch (error) {
      // Log error and re-throw for outer catch block
      console.error('❌ Database operation failed:', error)
      throw error
    }
    
  } catch (error) {
    console.error('❌ Profile completion error:', error)
    
    const response: ProfileCompletionResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}

// Configure the API route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
