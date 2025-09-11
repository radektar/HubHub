'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { CVUploadZone } from '@/components/cv-upload/cv-upload-zone'
import { ParsingResults } from '@/components/cv-upload/parsing-results'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CVParserResult, ParsedCVData } from '@/lib/cv-parser/types'
import { createClient } from '@/lib/supabase/client'

// Helper function to map parsed CV data to database format
function mapToDatabase(parsedData: ParsedCVData, userId: string) {
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
      total_experience_years: calculateTotalExperience(parsedData.workExperience),
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
      industry: 'Technology' // Default, should be updated based on company/role
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
      proficiency_level: mapLanguageProficiency(lang.proficiency),
      is_native: lang.proficiency?.toLowerCase().includes('native') || false
    })) || [],

    // Certifications
    certifications: parsedData.certifications?.map(cert => ({
      certification_name: cert.name,
      issuing_organization: cert.issuer,
      issue_date: cert.date ? new Date(cert.date) : null,
      credential_url: cert.url
    })) || []
  }
}

function calculateTotalExperience(workExperience: Array<{startDate?: string; endDate?: string}>): number {
  if (workExperience.length === 0) return 0

  let totalMonths = 0
  for (const exp of workExperience) {
    if (exp.startDate) {
      const start = new Date(exp.startDate)
      const end = exp.endDate && exp.endDate !== 'present' ? new Date(exp.endDate) : new Date()
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
      totalMonths += Math.max(months, 0)
    }
  }

  return Math.round(totalMonths / 12 * 10) / 10 // Round to 1 decimal place
}

function mapLanguageProficiency(proficiency?: string): number {
  if (!proficiency) return 3

  const prof = proficiency.toLowerCase()
  if (prof.includes('native') || prof.includes('fluent')) return 5
  if (prof.includes('advanced') || prof.includes('proficient')) return 4
  if (prof.includes('intermediate')) return 3
  if (prof.includes('basic') || prof.includes('beginner')) return 2
  if (prof.includes('elementary')) return 1

  return 3 // Default
}

enum UploadStep {
  UPLOAD = 'upload',
  REVIEW = 'review',
  SAVING = 'saving'
}

export default function CVUploadPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [currentStep, setCurrentStep] = useState<UploadStep>(UploadStep.UPLOAD)
  const [parsingResult, setParsingResult] = useState<CVParserResult | null>(null)
  const [parsedData, setParsedData] = useState<ParsedCVData | null>(null)
  const [, setIsSaving] = useState(false)

  const handleParsingStart = () => {
    setParsingResult(null)
    setParsedData(null)
  }

  const handleParsingComplete = (result: CVParserResult) => {
    setParsingResult(result)
    if (result.success && result.data) {
      setParsedData(result.data)
      setCurrentStep(UploadStep.REVIEW)
    }
  }

  const handleDataUpdate = (updatedData: ParsedCVData) => {
    setParsedData(updatedData)
  }

  const handleConfirm = async () => {
    if (!parsedData || !user) return

    setIsSaving(true)
    setCurrentStep(UploadStep.SAVING)

    try {
      const supabase = createClient()
      
      // Map parsed data to database format manually
      const dbData = mapToDatabase(parsedData, user.id)

      // First, create or update designer profile
      const { data: existingProfile } = await supabase
        .from('designer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      let profileId: string

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('designer_profiles')
          .update({
            ...dbData.designerProfile,
            // Keep existing values for required fields that might not be parsed
            title: dbData.designerProfile.name || 'Designer', // Default title
            availability: 'Available', // Default availability
            cv_file_url: 'pending', // Will be updated when file is uploaded to storage
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (updateError) throw updateError
        profileId = existingProfile.id
      } else {
        // Create new profile
        const { data: newProfile, error: insertError } = await supabase
          .from('designer_profiles')
          .insert({
            ...dbData.designerProfile,
            title: dbData.designerProfile.name || 'Designer',
            availability: 'Available',
            cv_file_url: 'pending',
            professional_summary: dbData.designerProfile.professional_summary || 'Professional summary pending',
            total_experience_years: dbData.designerProfile.total_experience_years || 0
          })
          .select('id')
          .single()

        if (insertError) throw insertError
        profileId = newProfile.id
      }

      // Insert work experiences
      if (dbData.workExperiences.length > 0) {
        // Delete existing work experiences
        await supabase
          .from('work_experiences')
          .delete()
          .eq('designer_profile_id', profileId)

        // Insert new work experiences
        const { error: workError } = await supabase
          .from('work_experiences')
          .insert(
            dbData.workExperiences.map(exp => ({
              ...exp,
              designer_profile_id: profileId,
              industry: exp.industry || 'Technology' // Default industry
            }))
          )

        if (workError) throw workError
      }

      // Insert skills
      if (dbData.skills.length > 0) {
        await supabase
          .from('skills')
          .delete()
          .eq('designer_profile_id', profileId)

        const { error: skillsError } = await supabase
          .from('skills')
          .insert(
            dbData.skills.map(skill => ({
              ...skill,
              designer_profile_id: profileId
            }))
          )

        if (skillsError) throw skillsError
      }

      // Insert languages
      if (dbData.languages.length > 0) {
        await supabase
          .from('languages')
          .delete()
          .eq('designer_profile_id', profileId)

        const { error: langError } = await supabase
          .from('languages')
          .insert(
            dbData.languages.map(lang => ({
              ...lang,
              designer_profile_id: profileId
            }))
          )

        if (langError) throw langError
      }

      // Insert education
      if (dbData.educations.length > 0) {
        await supabase
          .from('educations')
          .delete()
          .eq('designer_profile_id', profileId)

        const { error: eduError } = await supabase
          .from('educations')
          .insert(
            dbData.educations.map(edu => ({
              ...edu,
              designer_profile_id: profileId
            }))
          )

        if (eduError) throw eduError
      }

      // Redirect to profile completion page
      router.push('/designer/profile')

    } catch (error) {
      console.error('Error saving CV data:', error)
      alert('Failed to save CV data. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReject = () => {
    setCurrentStep(UploadStep.UPLOAD)
    setParsingResult(null)
    setParsedData(null)
  }

  if (!user || user.role !== 'designer') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">Access denied. Designer role required.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload Your CV</h1>
          <p className="text-gray-600 mt-2">
            Upload your CV and we&apos;ll automatically extract your professional information to create your designer profile.
          </p>
        </div>

        {currentStep === UploadStep.UPLOAD && (
          <div className="space-y-6">
            <CVUploadZone
              onParsingStart={handleParsingStart}
              onParsingComplete={handleParsingComplete}
            />

            {parsingResult && !parsingResult.success && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Parsing Failed</CardTitle>
                  <CardDescription>
                    We couldn&apos;t extract information from your CV. Please try a different format or contact support.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{parsingResult.error}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Processing time: {parsingResult.processingTime}ms
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {currentStep === UploadStep.REVIEW && parsedData && (
          <ParsingResults
            parsedData={parsedData}
            onDataUpdate={handleDataUpdate}
            onConfirm={handleConfirm}
            onReject={handleReject}
          />
        )}

        {currentStep === UploadStep.SAVING && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Saving Your Profile</h3>
              <p className="text-gray-600">
                We&apos;re processing your information and creating your designer profile...
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
