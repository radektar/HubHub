'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { CVUploadZone } from '@/components/cv-upload/cv-upload-zone'
import { ParsingResults } from '@/components/cv-upload/parsing-results'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CVParserResult, ParsedCVData } from '@/lib/cv-parser/types'
import { ProfileCompletionRequest, ProfileCompletionResponse } from '@/types/profile-completion.types'

// Helper function to convert ParsedCVData to ProfileCompletionRequest format
function convertToProfileCompletionRequest(parsedData: ParsedCVData, cvFileUrl?: string): ProfileCompletionRequest {
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
    languagesProficiency[lang.name] = mapLanguageProficiency(lang.proficiency)
  })
  
  return {
    personal: {
      name: parsedData.personal.name,
      email: parsedData.personal.email || '',
      phone: parsedData.personal.phone || '',
      location: parsedData.personal.location,
      portfolio: parsedData.personal.portfolio,
      linkedin: parsedData.personal.linkedin,
      summary: parsedData.personal.summary
    },
    
    mvpData: {
      title: parsedData.personal.name ? `${parsedData.personal.name} - Designer` : 'Designer', // Default title
      availability: 'Available', // Default availability
      totalExperienceYears: calculateTotalExperience(parsedData.workExperience),
      skillsProficiency,
      languagesProficiency
    },
    
    workExperience: parsedData.workExperience.map(exp => ({
      jobTitle: exp.jobTitle,
      company: exp.company,
      industry: exp.industry || 'Technology', // Default industry
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
    
    cvFileUrl: cvFileUrl || 'uploaded-cv-file'
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
  const { user, loading } = useAuthStore()
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
    if (!parsedData) return
    
    if (!user && !skipAuth) return

    setIsSaving(true)
    setCurrentStep(UploadStep.SAVING)

    try {
      // Convert parsed data to API format
      const profileRequest = convertToProfileCompletionRequest(parsedData, 'uploaded-cv-file')
      
      console.log('🚀 Sending profile completion request:', profileRequest)
      
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
      
      console.log('✅ Profile completion successful:', result)
      
      // Show success feedback
      if (result.isComplete) {
        alert(`Profile saved successfully! Your profile is ${result.completionPercentage}% complete.`)
      } else {
        const missingFieldsMsg = result.missingFields?.length 
          ? `Missing fields: ${result.missingFields.join(', ')}` 
          : 'Some required fields are still missing.'
        alert(`Profile saved! Completion: ${result.completionPercentage}%. ${missingFieldsMsg}`)
      }
      
      // Redirect to dashboard or profile completion page
      router.push('/dashboard')
      
    } catch (error) {
      console.error('❌ Error saving CV data:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to save CV data: ${errorMessage}. Please try again.`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReject = () => {
    setCurrentStep(UploadStep.UPLOAD)
    setParsingResult(null)
    setParsedData(null)
  }

  // Debug logging
  console.log('CVUploadPage - Loading:', loading)
  console.log('CVUploadPage - User object:', user)
  console.log('CVUploadPage - User role:', user?.role)
  console.log('CVUploadPage - Role type:', typeof user?.role)

  // TEMPORARY: Skip auth check for debugging
  const skipAuth = true

  // Manual debug function for authentication testing
  const debugAuth = async () => {
    console.log('=== MANUAL DEBUG ===')
    console.log('Environment check:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing')
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing')
    
    try {
      console.log('Testing profile completion API...')
      const testData = convertToProfileCompletionRequest({
        personal: { name: 'Test User', email: 'test@example.com', phone: '+1234567890' },
        workExperience: [],
        education: [],
        skills: { technical: ['JavaScript'] },
        rawText: '',
        confidence: 1.0,
        errors: []
      })
      
      console.log('Test profile completion request:', testData)
      
    } catch (error) {
      console.error('Manual debug error:', error)
    }
  }

  if (loading && !skipAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">Loading authentication...</p>
            <button 
              onClick={debugAuth}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Debug Auth
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user && !skipAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">No user found - please log in again</p>
            <button 
              onClick={debugAuth}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Debug Auth
            </button>
            <button 
              onClick={() => router.push('/auth/login')}
              className="mt-2 ml-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Go to Login
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (user?.role !== 'designer' && !skipAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-500">
              Access denied. Designer role required.
            </p>
            <p className="text-center text-sm text-gray-500 mt-2">
              Current role: &quot;{user?.role}&quot; (type: {typeof user?.role})
            </p>
            <p className="text-center text-sm text-gray-500">
              User ID: {user?.id}
            </p>
            <p className="text-center text-sm text-gray-500">
              Email: {user?.email}
            </p>
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
            showSaveButton={true}
            cvFileUrl="uploaded-cv-file"
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
