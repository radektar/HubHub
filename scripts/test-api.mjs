// Test the profile completion API endpoint
// Run with: node scripts/test-api.mjs

const testProfileData = {
  personal: {
    name: "Test Designer",
    email: "test@example.com",
    phone: "+1234567890",
    location: "Test City",
    portfolio: "https://portfolio.test.com",
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
  ],
  cvFileUrl: "test-cv-file-url"
}

async function testAPI() {
  console.log('🧪 Testing Profile Completion API...')
  
  try {
    const response = await fetch('http://localhost:3001/api/designer/profile-complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail because we don't have auth token
      },
      body: JSON.stringify(testProfileData)
    })
    
    const result = await response.json()
    
    console.log('📊 API Response:')
    console.log('Status:', response.status)
    console.log('Result:', result)
    
    if (response.ok) {
      console.log('✅ API call successful!')
    } else {
      console.log('❌ API call failed:', result.error)
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message)
  }
}

testAPI()


