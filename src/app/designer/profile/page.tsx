'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { CVUploadZone } from '@/components/cv-upload/cv-upload-zone'
import { ParsingResults } from '@/components/cv-upload/parsing-results'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CVParserResult, ParsedCVData } from '@/lib/cv-parser/types'
import { ProfileCompletionRequest, ProfileCompletionResponse } from '@/types/profile-completion.types'
import { createClient } from '@/lib/supabase/client'

enum ProfileStep {
  LOADING = 'loading',
  NO_PROFILE = 'no_profile',
  CV_UPLOAD = 'cv_upload',
  PROFILE_EDIT = 'profile_edit',
  SAVING = 'saving'
}

interface ExistingProfileData {
  profile: Record<string, unknown>
  workExperiences: Record<string, unknown>[]
  skills: Record<string, unknown>[]
  languages: Record<string, unknown>[]
  education: Record<string, unknown>[]
}

export default function DesignerProfilePage() {
  const router = useRouter()
  const { user, loading } = useAuthStore()
  const [currentStep, setCurrentStep] = useState<ProfileStep>(ProfileStep.LOADING)
  const [existingData, setExistingData] = useState<ExistingProfileData | null>(null)
  const [initialMvpData, setInitialMvpData] = useState<Record<string, unknown> | null>(null)
  const [parsingResult, setParsingResult] = useState<CVParserResult | null>(null)
  const [parsedData, setParsedData] = useState<ParsedCVData | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Check for existing profile data on component mount
  useEffect(() => {
    if (!loading && user) {
      loadExistingProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading])

  const loadExistingProfile = async () => {
    if (!user) return

    try {
      console.log('🔍 Loading existing profile for user:', user.id)
      const supabase = createClient()

      // Check if user has existing profile - simplified query first
      console.log('🔍 Querying designer_profiles for user:', user.id)
      
      const { data: profile, error: profileError } = await supabase
        .from('designer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      console.log('👤 Profile query result:', { profile, error: profileError })
      
      // If profile exists, load related data separately
      let fullProfile = profile
      if (profile && !profileError) {
        console.log('📋 Loading related data for profile:', profile.id)
        
        const [workExp, skills, languages, education] = await Promise.all([
          supabase.from('work_experiences').select('*').eq('designer_profile_id', profile.id),
          supabase.from('skills').select('*').eq('designer_profile_id', profile.id),
          supabase.from('languages').select('*').eq('designer_profile_id', profile.id),
          supabase.from('educations').select('*').eq('designer_profile_id', profile.id)
        ])
        
        console.log('📊 Related data results:', {
          workExp: workExp.data?.length || 0,
          skills: skills.data?.length || 0,
          languages: languages.data?.length || 0,
          education: education.data?.length || 0,
          errors: {
            workExp: workExp.error?.message,
            skills: skills.error?.message,
            languages: languages.error?.message,
            education: education.error?.message
          }
        })
        
        // Combine data
        fullProfile = {
          ...profile,
          work_experiences: workExp.data || [],
          skills: skills.data || [],
          languages: languages.data || [],
          educations: education.data || []
        }
      }

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // No profile found - this is normal for new users
          console.log('📝 No existing profile found - showing CV upload')
          setCurrentStep(ProfileStep.NO_PROFILE)
        } else {
          console.error('Error loading profile:', profileError)
          setCurrentStep(ProfileStep.NO_PROFILE)
        }
        return
      }

      if (fullProfile) {
        console.log('✅ Existing profile found:', fullProfile)
        
        // Convert database format back to ParsedCVData format for editing
        const convertedData = convertDatabaseToParsingFormat(fullProfile)
        const mvpData = convertDatabaseToMvpData(fullProfile)
        
        console.log('📋 Converted MVP data:', mvpData)
        
        setParsedData(convertedData)
        setInitialMvpData(mvpData)
        setExistingData({
          profile: fullProfile,
          workExperiences: fullProfile.work_experiences || [],
          skills: fullProfile.skills || [],
          languages: fullProfile.languages || [],
          education: fullProfile.educations || []
        })
        setCurrentStep(ProfileStep.PROFILE_EDIT)
      } else {
        setCurrentStep(ProfileStep.NO_PROFILE)
      }
    } catch (error) {
      console.error('Error in loadExistingProfile:', error)
      setCurrentStep(ProfileStep.NO_PROFILE)
    }
  }

  // Convert database format to MVP data for ParsingResults component
  const convertDatabaseToMvpData = (dbProfile: Record<string, unknown>) => {
    const skills = (dbProfile.skills as Record<string, unknown>[]) || []
    const languages = (dbProfile.languages as Record<string, unknown>[]) || []
    
    // Create skills proficiency map
    const skillsProficiency: Record<string, number> = {}
    skills.forEach((skill: Record<string, unknown>) => {
      skillsProficiency[skill.skill_name as string] = (skill.proficiency_level as number) || 3
    })
    
    // Create languages proficiency map  
    const languagesProficiency: Record<string, number> = {}
    languages.forEach((lang: Record<string, unknown>) => {
      languagesProficiency[lang.language_name as string] = (lang.proficiency_level as number) || 3
    })
    
    return {
      title: (dbProfile.title as string) || '',
      availability: (dbProfile.availability as string) || 'Available',
      totalExperienceYears: (dbProfile.total_experience_years as number) || 0,
      skillsProficiency,
      languagesProficiency
    }
  }

  // Convert database format back to ParsedCVData format
  const convertDatabaseToParsingFormat = (dbProfile: Record<string, unknown>): ParsedCVData => {
    const skills = (dbProfile.skills as Record<string, unknown>[]) || []
    const workExperiences = (dbProfile.work_experiences as Record<string, unknown>[]) || []
    const languages = (dbProfile.languages as Record<string, unknown>[]) || []
    const educations = (dbProfile.educations as Record<string, unknown>[]) || []

    return {
      personal: {
        name: dbProfile.name as string,
        email: dbProfile.email as string,
        phone: dbProfile.phone as string,
        location: dbProfile.location as string,
        portfolio: dbProfile.portfolio_url as string,
        summary: dbProfile.professional_summary as string
      },
      workExperience: workExperiences.map((exp: Record<string, unknown>) => ({
        jobTitle: exp.job_title as string,
        company: exp.company_name as string,
        industry: exp.industry as string,
        location: exp.location as string,
        startDate: exp.start_date as string,
        endDate: exp.end_date as string,
        isCurrent: exp.is_current as boolean,
        description: exp.description as string,
        achievements: (exp.achievements as string[]) || [],
        technologies: (exp.technologies_used as string[]) || []
      })),
      education: educations.map((edu: Record<string, unknown>) => ({
        degree: edu.degree_type as string,
        institution: edu.institution_name as string,
        location: edu.location as string,
        startDate: edu.start_date as string,
        endDate: edu.end_date as string,
        gpa: (edu.gpa as number)?.toString(),
        honors: (edu.honors as string[]) || []
      })),
      skills: {
        technical: skills.filter((s: Record<string, unknown>) => s.category === 'technical').map((s: Record<string, unknown>) => s.skill_name as string),
        design: skills.filter((s: Record<string, unknown>) => s.category === 'design').map((s: Record<string, unknown>) => s.skill_name as string),
        tools: skills.filter((s: Record<string, unknown>) => s.category === 'tool').map((s: Record<string, unknown>) => s.skill_name as string),
        soft: skills.filter((s: Record<string, unknown>) => s.category === 'soft').map((s: Record<string, unknown>) => s.skill_name as string),
        languages: languages.map((lang: Record<string, unknown>) => ({
          name: lang.language_name as string,
          proficiency: mapProficiencyLevelToString(lang.proficiency_level as number)
        }))
      },
      rawText: '',
      confidence: 1.0,
      errors: []
    }
  }

  const mapProficiencyLevelToString = (level: number): string => {
    switch (level) {
      case 5: return 'Native/Fluent'
      case 4: return 'Advanced'
      case 3: return 'Intermediate'
      case 2: return 'Basic'
      case 1: return 'Elementary'
      default: return 'Intermediate'
    }
  }

  const handleStartCVUpload = () => {
    setCurrentStep(ProfileStep.CV_UPLOAD)
  }

  const handleParsingStart = () => {
    setParsingResult(null)
    setParsedData(null)
  }

  const handleParsingComplete = (result: CVParserResult) => {
    setParsingResult(result)
    if (result.success && result.data) {
      setParsedData(result.data)
      setCurrentStep(ProfileStep.PROFILE_EDIT)
    }
  }

  const handleDataUpdate = (updatedData: ParsedCVData) => {
    setParsedData(updatedData)
  }

  const handleSaveProfile = async () => {
    if (!parsedData || !user) return

    setIsSaving(true)
    setCurrentStep(ProfileStep.SAVING)

    try {
      // Convert to API format - reuse the conversion logic from CV upload page
      const profileRequest = convertToProfileCompletionRequest(parsedData, (existingData?.profile?.cv_file_url as string) || 'uploaded-cv-file')
      
      console.log('💾 Saving profile updates:', profileRequest)
      
      // Call the profile completion API
      const response = await fetch('/api/designer/profile-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileRequest)
      })
      
      const result: ProfileCompletionResponse = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || `API request failed with status ${response.status}`)
      }
      
      console.log('✅ Profile saved successfully:', result)
      
      // Show success feedback
      if (result.isComplete) {
        alert(`Profile saved successfully! Your profile is ${result.completionPercentage}% complete.`)
      } else {
        const missingFieldsMsg = result.missingFields?.length 
          ? `Missing fields: ${result.missingFields.join(', ')}` 
          : 'Some required fields are still missing.'
        alert(`Profile saved! Completion: ${result.completionPercentage}%. ${missingFieldsMsg}`)
      }
      
      // Redirect to dashboard
      router.push('/dashboard')
      
    } catch (error) {
      console.error('❌ Error saving profile:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to save profile: ${errorMessage}. Please try again.`)
      setCurrentStep(ProfileStep.PROFILE_EDIT)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard')
  }

  // Helper function to convert ParsedCVData to ProfileCompletionRequest format
  const convertToProfileCompletionRequest = (parsedData: ParsedCVData, cvFileUrl?: string): ProfileCompletionRequest => {
    // Calculate default proficiency levels for skills and languages
    const skillsProficiency: Record<string, number> = {}
    const languagesProficiency: Record<string, number> = {}
    
    // Default proficiency level for skills (3 = intermediate)
    const allSkills = [
      ...(parsedData.skills.technical || []),
      ...(parsedData.skills.design || []),
      ...(parsedData.skills.tools || []),
      ...(parsedData.skills.soft || [])
    ]
    allSkills.forEach(skill => {
      skillsProficiency[skill] = 3 // Default intermediate level
    })
    
    // Default proficiency level for languages
    parsedData.skills.languages?.forEach(lang => {
      languagesProficiency[lang.name] = mapLanguageProficiencyToNumber(lang.proficiency)
    })
    
    // Calculate total experience
    const totalExperience = calculateTotalExperience(parsedData.workExperience)
    
    return {
      personal: {
        name: parsedData.personal.name,
        email: parsedData.personal.email || user?.email || '',
        phone: parsedData.personal.phone || '',
        location: parsedData.personal.location,
        portfolio: parsedData.personal.portfolio,
        linkedin: parsedData.personal.linkedin,
        summary: parsedData.personal.summary
      },
      
      mvpData: {
        title: parsedData.personal.name ? `${parsedData.personal.name} - Designer` : 'Designer',
        availability: 'Available',
        totalExperienceYears: totalExperience,
        skillsProficiency,
        languagesProficiency
      },
      
      workExperience: parsedData.workExperience.map(exp => ({
        jobTitle: exp.jobTitle,
        company: exp.company,
        industry: exp.industry || 'Technology',
        location: exp.location,
        startDate: exp.startDate,
        endDate: exp.endDate,
        isCurrent: exp.isCurrent,
        description: exp.description,
        achievements: exp.achievements,
        technologies: exp.technologies
      })),
      
      skills: parsedData.skills,
      
      education: parsedData.education,
      
      cvFileUrl: cvFileUrl || 'profile-edit'
    }
  }

  const mapLanguageProficiencyToNumber = (proficiency?: string): number => {
    if (!proficiency) return 3

    const prof = proficiency.toLowerCase()
    if (prof.includes('native') || prof.includes('fluent')) return 5
    if (prof.includes('advanced') || prof.includes('proficient')) return 4
    if (prof.includes('intermediate')) return 3
    if (prof.includes('basic') || prof.includes('beginner')) return 2
    if (prof.includes('elementary')) return 1

    return 3 // Default
  }

  const calculateTotalExperience = (workExperience: Array<{startDate?: string; endDate?: string}>): number => {
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

  // Authentication check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-center text-gray-500">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user || user.role !== 'designer') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-500">
              Access denied. Designer role required.
            </p>
            <Button 
              onClick={() => router.push('/dashboard')}
              className="mt-4 w-full"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Designer Profile</h1>
          <p className="text-gray-600 mt-2">
            {existingData ? 'Edit your designer profile' : 'Create your designer profile by uploading your CV'}
          </p>
        </div>

        {currentStep === ProfileStep.LOADING && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Your Profile</h3>
              <p className="text-gray-600">
                Checking for existing profile data...
              </p>
            </CardContent>
          </Card>
        )}

        {currentStep === ProfileStep.NO_PROFILE && (
          <Card>
            <CardHeader>
              <CardTitle>Create Your Designer Profile</CardTitle>
              <CardDescription>
                Start by uploading your CV to automatically extract your professional information, or create a profile manually.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleStartCVUpload}
                className="w-full"
                size="lg"
              >
                Upload CV to Get Started
              </Button>
              <div className="text-center">
                <Button 
                  variant="outline"
                  onClick={handleCancel}
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === ProfileStep.CV_UPLOAD && (
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
                  <div className="mt-4 space-x-4">
                    <Button 
                      variant="outline"
                      onClick={() => setCurrentStep(ProfileStep.NO_PROFILE)}
                    >
                      Try Again
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {currentStep === ProfileStep.PROFILE_EDIT && parsedData && (
          <ParsingResults
            parsedData={parsedData}
            onDataUpdate={handleDataUpdate}
            onConfirm={handleSaveProfile}
            onReject={handleCancel}
            showSaveButton={true}
            cvFileUrl={(existingData?.profile?.cv_file_url as string) || 'profile-edit'}
            isEditMode={!!existingData}
            initialMvpData={initialMvpData || undefined}
          />
        )}

        {currentStep === ProfileStep.SAVING && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Saving Your Profile</h3>
              <p className="text-gray-600">
                We&apos;re processing your information and updating your designer profile...
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
