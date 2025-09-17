// Test API endpoint to verify database integration without authentication
// This is for testing purposes only - bypasses authentication

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateProfileCompletion } from '@/lib/validation'

export async function POST(request: NextRequest) {
  console.log('🧪 Test Database API called')
  
  try {
    const supabase = await createClient()
    
    // Test data (simulating a parsed CV)
    const testData = {
      personal: {
        name: "Test Designer",
        email: "test@example.com",
        phone: "+1234567890",
        location: "Test City",
        portfolio: "https://portfolio.test.com",
        linkedin: "www.linkedin.com/in/test-designer",
        summary: "Test professional summary with more than 50 characters to meet validation requirements"
      },
      mvpData: {
        title: "UX Designer",
        availability: "Available", 
        totalExperienceYears: 5,
        skillsProficiency: {
          "Figma": 4,
          "Adobe XD": 3,
          "User Research": 5
        },
        languagesProficiency: {
          "English": 5,
          "Spanish": 3
        }
      },
      workExperience: [
        {
          jobTitle: "Senior UX Designer",
          company: "Tech Company",
          industry: "Technology",
          location: "San Francisco",
          startDate: "2020-01-01",
          endDate: "2023-12-31",
          isCurrent: false,
          description: "Led design projects"
        }
      ],
      skills: {
        technical: ["JavaScript", "React"],
        design: ["Figma", "Adobe XD"],
        tools: ["Sketch", "Photoshop"],
        soft: ["Communication", "Leadership"],
        languages: [
          { name: "English", proficiency: "Native" },
          { name: "Spanish", proficiency: "Intermediate" }
        ]
      },
      education: [
        {
          degree: "Bachelor of Design",
          institution: "Design University",
          startDate: "2015-09-01",
          endDate: "2019-06-01"
        }
      ]
    }
    
    // Test validation
    const parsedDataForValidation = {
      personal: testData.personal,
      workExperience: testData.workExperience,
      skills: testData.skills,
      education: testData.education || [],
      rawText: '',
      confidence: 1.0,
      errors: []
    }
    
    const validationResult = validateProfileCompletion(parsedDataForValidation, testData.mvpData)
    console.log('🔍 Validation result:', {
      isValid: validationResult.isValid,
      percentage: validationResult.completionPercentage,
      missingCount: validationResult.missingFields.length
    })
    
    // Create a test user ID (we'll use service role to bypass RLS)
    const testUserId = '12345678-1234-1234-1234-123456789012'
    
    // Try to create a test designer profile (using service role should bypass RLS)
    const { data: profileResult, error: profileError } = await supabase
      .from('designer_profiles')
      .upsert({
        id: '87654321-4321-4321-4321-210987654321',
        user_id: testUserId,
        name: testData.personal.name,
        title: testData.mvpData.title,
        phone: testData.personal.phone,
        email: testData.personal.email,
        availability: testData.mvpData.availability,
        portfolio_url: testData.personal.portfolio || testData.personal.linkedin || '',
        cv_file_url: 'test-cv-file-url',
        professional_summary: testData.personal.summary || '',
        total_experience_years: testData.mvpData.totalExperienceYears,
        location: testData.personal.location,
        is_profile_complete: validationResult.isValid
      }, { onConflict: 'id' })
      .select('id')
    
    if (profileError) {
      console.error('❌ Profile creation failed:', profileError)
      return NextResponse.json({
        success: false,
        error: `Profile creation failed: ${profileError.message}`,
        details: profileError
      }, { status: 500 })
    }
    
    const profileId = profileResult?.[0]?.id || '87654321-4321-4321-4321-210987654321'
    console.log('✅ Test profile created:', profileId)
    
    // Test inserting work experience
    const { error: workError } = await supabase
      .from('work_experiences')
      .upsert(testData.workExperience.map(exp => ({
        designer_profile_id: profileId,
        job_title: exp.jobTitle,
        company_name: exp.company!,
        industry: exp.industry,
        location: exp.location,
        start_date: exp.startDate,
        end_date: exp.endDate,
        is_current: exp.isCurrent || false,
        description: exp.description
      })), { onConflict: 'designer_profile_id,company_name' })
    
    if (workError) {
      console.error('❌ Work experience creation failed:', workError)
    } else {
      console.log('✅ Work experiences created')
    }
    
    // Test inserting skills
    const skillsToInsert = [
      ...testData.skills.technical?.map(skill => ({
        designer_profile_id: profileId,
        skill_name: skill,
        category: 'technical' as const,
        proficiency_level: (testData.mvpData.skillsProficiency as Record<string, number>)[skill] || 3
      })) || [],
      ...testData.skills.design?.map(skill => ({
        designer_profile_id: profileId,
        skill_name: skill,
        category: 'design' as const,
        proficiency_level: (testData.mvpData.skillsProficiency as Record<string, number>)[skill] || 3
      })) || []
    ]
    
    const { error: skillsError } = await supabase
      .from('skills')
      .upsert(skillsToInsert, { onConflict: 'designer_profile_id,skill_name' })
    
    if (skillsError) {
      console.error('❌ Skills creation failed:', skillsError)
    } else {
      console.log('✅ Skills created:', skillsToInsert.length)
    }
    
    // Test inserting languages
    const languagesToInsert = testData.skills.languages?.map(lang => ({
      designer_profile_id: profileId,
      language_name: lang.name,
      proficiency_level: (testData.mvpData.languagesProficiency as Record<string, number>)[lang.name] || 3
    })) || []
    
    const { error: languagesError } = await supabase
      .from('languages')
      .upsert(languagesToInsert, { onConflict: 'designer_profile_id,language_name' })
    
    if (languagesError) {
      console.error('❌ Languages creation failed:', languagesError)
    } else {
      console.log('✅ Languages created:', languagesToInsert.length)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test database integration completed successfully!',
      validation: {
        isComplete: validationResult.isValid,
        percentage: validationResult.completionPercentage,
        missingFields: validationResult.missingFields
      },
      profileId: profileId,
      dataInserted: {
        profile: !profileError,
        workExperience: !workError,
        skills: !skillsError,
        languages: !languagesError
      }
    })
    
  } catch (error) {
    console.error('❌ Test database error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}

// Configure the API route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'


