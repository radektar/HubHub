'use client'

import { useState } from 'react'
import { Check, X, Edit2, User, Briefcase, GraduationCap, Code, Globe, Star, StarIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ParsedCVData } from '@/lib/cv-parser/types'

// Constants for dropdowns
const DESIGN_TITLES = [
  'UX Designer',
  'UI Designer', 
  'Product Designer',
  'UX/UI Designer',
  'Visual Designer',
  'Interaction Designer',
  'Service Designer',
  'Design Lead',
  'Senior Designer',
  'Junior Designer',
  'Design Manager',
  'Creative Director',
  'Other'
]

const AVAILABILITY_OPTIONS = [
  'Available',
  'Busy',
  'Not Available'
]

const INDUSTRIES = [
  'Automotive', 'Energy', 'IT', 'Finance', 'Insurance', 'Banking', 
  'Healthcare', 'Startups', 'Blockchain/Crypto', 'AdTech/MarTech', 
  'Manufacturing', 'Construction', 'eCommerce', 'Education', 
  'Transport/Logistics', 'Agriculture', 'Tourism/Hospitality', 
  'Telecommunications', 'Green Tech', 'HR', 'Other'
]

// Helper function to calculate total experience years
function calculateTotalExperience(workExperience: any[]): number {
  if (!workExperience || workExperience.length === 0) return 0
  
  let totalMonths = 0
  const currentDate = new Date()
  
  workExperience.forEach(exp => {
    if (exp.startDate) {
      const startDate = new Date(exp.startDate)
      const endDate = exp.isCurrent ? currentDate : (exp.endDate ? new Date(exp.endDate) : currentDate)
      
      if (startDate && endDate && endDate > startDate) {
        const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (endDate.getMonth() - startDate.getMonth())
        totalMonths += monthsDiff
      }
    }
  })
  
  return Math.round(totalMonths / 12 * 10) / 10 // Round to 1 decimal
}

// Enhanced validation function for MVP requirements
function validateParsedData(data: ParsedCVData, mvpData?: any): {
  isValid: boolean
  missingFields: string[]
  suggestions: string[]
  completionPercentage: number
} {
  const missingFields: string[] = []
  const suggestions: string[] = []
  const totalRequiredFields = 11 // Total MVP required field categories
  let completedFields = 0

  // Check required personal information
  if (!data.personal.email) {
    missingFields.push('email')
    suggestions.push('Please ensure your email address is clearly visible in the CV')
  } else completedFields++

  if (!data.personal.name) {
    missingFields.push('name')
    suggestions.push('Please ensure your full name appears at the top of the CV')
  } else completedFields++

  if (!data.personal.phone) {
    missingFields.push('phone')
    suggestions.push('Please include your phone number in the contact information')
  } else completedFields++

  // Check MVP required fields
  if (!mvpData?.title) {
    missingFields.push('title')
    suggestions.push('Please select your professional title/position')
  } else completedFields++

  if (!mvpData?.availability) {
    missingFields.push('availability')
    suggestions.push('Please specify your availability status')
  } else completedFields++

  if (!data.personal.portfolio && !data.personal.linkedin) {
    missingFields.push('portfolio_url')
    suggestions.push('Please provide your portfolio URL or LinkedIn profile')
  } else completedFields++

  if (!data.personal.summary) {
    missingFields.push('professional_summary')
    suggestions.push('Please add a professional summary')
  } else completedFields++

  if (!mvpData?.totalExperienceYears && calculateTotalExperience(data.workExperience) === 0) {
    missingFields.push('total_experience_years')
    suggestions.push('Please specify your total years of experience')
  } else completedFields++

  // Check work experience with industry
  if (data.workExperience.length === 0) {
    missingFields.push('work_experience')
    suggestions.push('Please include your work experience with company names and industries')
  } else {
    const hasIndustry = data.workExperience.some(exp => exp.industry)
    if (!hasIndustry) {
      missingFields.push('work_experience_industry')
      suggestions.push('Please specify the industry for your work experiences')
    } else completedFields++
  }

  // Check skills with proficiency
  const totalSkills = (data.skills.technical?.length || 0) + 
                     (data.skills.design?.length || 0) + 
                     (data.skills.tools?.length || 0)
  
  if (totalSkills === 0) {
    missingFields.push('skills')
    suggestions.push('Please include your skills with proficiency levels')
  } else {
    // Check if skills have proficiency levels
    const hasSkillProficiency = mvpData?.skillsProficiency && Object.keys(mvpData.skillsProficiency).length > 0
    if (!hasSkillProficiency) {
      missingFields.push('skills_proficiency')
      suggestions.push('Please rate your proficiency level for each skill (1-5 scale)')
    } else completedFields++
  }

  // Check languages with proficiency
  if (!data.skills.languages || data.skills.languages.length === 0) {
    missingFields.push('languages')
    suggestions.push('Please include your language skills with proficiency levels')
  } else {
    const hasLanguageProficiency = mvpData?.languagesProficiency && Object.keys(mvpData.languagesProficiency).length > 0
    if (!hasLanguageProficiency) {
      missingFields.push('languages_proficiency')
      suggestions.push('Please rate your proficiency level for each language (1-5 scale)')
    } else completedFields++
  }

  const completionPercentage = Math.round((completedFields / totalRequiredFields) * 100)

  return {
    isValid: missingFields.length === 0,
    missingFields,
    suggestions,
    completionPercentage
  }
}

interface ParsingResultsProps {
  parsedData: ParsedCVData
  onDataUpdate: (updatedData: ParsedCVData) => void
  onConfirm: () => void
  onReject: () => void
}

export function ParsingResults({ parsedData, onDataUpdate, onConfirm, onReject }: ParsingResultsProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [localData, setLocalData] = useState<ParsedCVData>(parsedData)
  
  // MVP required fields state
  const [mvpData, setMvpData] = useState({
    title: '',
    availability: 'Available',
    totalExperienceYears: calculateTotalExperience(parsedData.workExperience),
    skillsProficiency: {} as Record<string, number>,
    languagesProficiency: {} as Record<string, number>
  })

  const validation = validateParsedData(localData, mvpData)
  const confidenceColor = localData.confidence > 0.7 ? 'text-green-600' : 
                         localData.confidence > 0.4 ? 'text-yellow-600' : 'text-red-600'

  const updatePersonalInfo = (field: string, value: string) => {
    const updated = {
      ...localData,
      personal: { ...localData.personal, [field]: value }
    }
    setLocalData(updated)
    onDataUpdate(updated)
  }

  const updateMvpData = (field: string, value: any) => {
    const updated = { ...mvpData, [field]: value }
    setMvpData(updated)
    // Also update the main data structure for consistency
    onDataUpdate({ ...localData, mvpData: updated })
  }

  const addWorkExperience = () => {
    const updated = {
      ...localData,
      workExperience: [...localData.workExperience, {
        jobTitle: '',
        company: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: ''
      }]
    }
    setLocalData(updated)
    onDataUpdate(updated)
  }

  const updateWorkExperience = (index: number, field: string, value: string | boolean) => {
    const updated = { ...localData }
    updated.workExperience[index] = { ...updated.workExperience[index], [field]: value }
    
    // Recalculate total experience if dates change
    if (field === 'startDate' || field === 'endDate' || field === 'isCurrent') {
      const newTotalExp = calculateTotalExperience(updated.workExperience)
      setMvpData(prev => ({ ...prev, totalExperienceYears: newTotalExp }))
    }
    
    setLocalData(updated)
    onDataUpdate(updated)
  }

  const addSkill = (category: keyof typeof localData.skills, skill: string) => {
    if (!skill.trim()) return
    
    const updated = { ...localData }
    const currentSkills = updated.skills[category] as string[]
    if (!currentSkills.includes(skill)) {
      (updated.skills[category] as string[]) = [...currentSkills, skill]
      setLocalData(updated)
      onDataUpdate(updated)
    }
  }

  const removeSkill = (category: keyof typeof localData.skills, skillIndex: number) => {
    const updated = { ...localData }
    const skillName = (updated.skills[category] as string[])[skillIndex]
    ;(updated.skills[category] as string[]).splice(skillIndex, 1)
    
    // Remove proficiency rating for removed skill
    if (skillName && mvpData.skillsProficiency[skillName]) {
      const updatedProficiency = { ...mvpData.skillsProficiency }
      delete updatedProficiency[skillName]
      setMvpData(prev => ({ ...prev, skillsProficiency: updatedProficiency }))
    }
    
    setLocalData(updated)
    onDataUpdate(updated)
  }

  const updateSkillProficiency = (skillName: string, proficiency: number) => {
    const updatedProficiency = { ...mvpData.skillsProficiency, [skillName]: proficiency }
    setMvpData(prev => ({ ...prev, skillsProficiency: updatedProficiency }))
  }

  const updateLanguageProficiency = (languageName: string, proficiency: number) => {
    const updatedProficiency = { ...mvpData.languagesProficiency, [languageName]: proficiency }
    setMvpData(prev => ({ ...prev, languagesProficiency: updatedProficiency }))
  }

  // Star rating component
  const StarRating = ({ value, onChange, skillName }: { value: number, onChange: (rating: number) => void, skillName: string }) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`w-4 h-4 ${rating <= value ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
            title={`Rate ${skillName} as ${rating} out of 5`}
            aria-label={`Rate ${skillName} as ${rating} out of 5 stars`}
          >
            <Star className="w-4 h-4 fill-current" />
          </button>
        ))}
        <span className="text-xs text-gray-500 ml-2">{value}/5</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with confidence and validation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>CV Parsing Results</span>
            <div className="flex items-center space-x-4">
              <span className={`text-sm font-medium ${confidenceColor}`}>
                Confidence: {Math.round(localData.confidence * 100)}%
              </span>
              {validation.isValid ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <Check className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <X className="h-3 w-3 mr-1" />
                  Needs Review
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        {!validation.isValid && (
          <CardContent>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-yellow-800">Profile Completion</h4>
                <span className="text-sm font-medium text-yellow-800">
                  {validation.completionPercentage}% Complete
                </span>
              </div>
              <div className="w-full bg-yellow-200 rounded-full h-2 mb-3" role="progressbar" aria-label={`Profile completion progress: ${validation.completionPercentage}%`}>
                <div 
                  className="bg-yellow-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, Math.max(0, validation.completionPercentage))}%` }}
                />
              </div>
              <ul className="text-sm text-yellow-700 space-y-1">
                {validation.suggestions.map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Personal Information</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingSection(editingSection === 'personal' ? null : 'personal')}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              {editingSection === 'personal' ? (
                <Input
                  value={localData.personal.name || ''}
                  onChange={(e) => updatePersonalInfo('name', e.target.value)}
                  placeholder="Full name"
                />
              ) : (
                <p className={`text-sm ${!localData.personal.name ? 'text-red-500' : ''}`}>
                  {localData.personal.name || 'Not found - please add'}
                </p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium">Email *</label>
              {editingSection === 'personal' ? (
                <Input
                  type="email"
                  value={localData.personal.email || ''}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  placeholder="Email address"
                />
              ) : (
                <p className={`text-sm ${!localData.personal.email ? 'text-red-500' : ''}`}>
                  {localData.personal.email || 'Not found - please add'}
                </p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium">Phone *</label>
              {editingSection === 'personal' ? (
                <Input
                  value={localData.personal.phone || ''}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  placeholder="Phone number"
                />
              ) : (
                <p className={`text-sm ${!localData.personal.phone ? 'text-red-500' : ''}`}>
                  {localData.personal.phone || 'Not found - please add'}
                </p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium">Location</label>
              {editingSection === 'personal' ? (
                <Input
                  value={localData.personal.location || ''}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                  placeholder="City, Country"
                />
              ) : (
                <p className="text-sm">{localData.personal.location || 'Not specified'}</p>
              )}
            </div>
            
            {/* NEW MVP REQUIRED FIELDS */}
            <div>
              <label className="text-sm font-medium">Professional Title *</label>
              <Select value={mvpData.title} onValueChange={(value) => updateMvpData('title', value)}>
                <SelectTrigger className={`${!mvpData.title ? 'border-red-300' : ''}`}>
                  <SelectValue placeholder="Select your title" />
                </SelectTrigger>
                <SelectContent>
                  {DESIGN_TITLES.map((title) => (
                    <SelectItem key={title} value={title}>{title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!mvpData.title && (
                <p className="text-xs text-red-500 mt-1">Required for profile completion</p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium">Availability Status *</label>
              <Select value={mvpData.availability} onValueChange={(value) => updateMvpData('availability', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Total Experience Years *</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={mvpData.totalExperienceYears}
                  onChange={(e) => updateMvpData('totalExperienceYears', parseFloat(e.target.value) || 0)}
                  placeholder="Years of experience"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const calculated = calculateTotalExperience(localData.workExperience)
                    updateMvpData('totalExperienceYears', calculated)
                  }}
                >
                  Auto-calculate
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Auto-calculated from work experience: {calculateTotalExperience(localData.workExperience)} years
              </p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Portfolio/LinkedIn *</label>
            {editingSection === 'personal' ? (
              <Input
                value={localData.personal.portfolio || localData.personal.linkedin || ''}
                onChange={(e) => updatePersonalInfo('portfolio', e.target.value)}
                placeholder="Portfolio URL or LinkedIn profile"
                className={`${!localData.personal.portfolio && !localData.personal.linkedin ? 'border-red-300' : ''}`}
              />
            ) : (
              <p className={`text-sm ${!localData.personal.portfolio && !localData.personal.linkedin ? 'text-red-500' : ''}`}>
                {localData.personal.portfolio || localData.personal.linkedin || 'Not found - please add'}
              </p>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium">Professional Summary *</label>
            {editingSection === 'personal' ? (
              <Textarea
                value={localData.personal.summary || ''}
                onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                placeholder="Brief professional summary"
                rows={3}
                className={`${!localData.personal.summary ? 'border-red-300' : ''}`}
              />
            ) : (
              <p className={`text-sm ${!localData.personal.summary ? 'text-red-500' : ''}`}>
                {localData.personal.summary || 'Not found - please add'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5" />
              <span>Work Experience ({localData.workExperience.length})</span>
            </div>
            <Button variant="outline" size="sm" onClick={addWorkExperience}>
              Add Experience
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {localData.workExperience.length === 0 ? (
            <p className="text-sm text-red-500">No work experience found - please add manually</p>
          ) : (
            <div className="space-y-4">
              {localData.workExperience.map((exp, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <Input
                      placeholder="Job Title *"
                      value={exp.jobTitle || ''}
                      onChange={(e) => updateWorkExperience(index, 'jobTitle', e.target.value)}
                    />
                    <Input
                      placeholder="Company Name *"
                      value={exp.company || ''}
                      onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                      className={`${!exp.company ? 'border-red-300' : ''}`}
                    />
                    <div>
                      <Select 
                        value={exp.industry || ''} 
                        onValueChange={(value) => updateWorkExperience(index, 'industry', value)}
                      >
                        <SelectTrigger className={`${!exp.industry ? 'border-red-300' : ''}`}>
                          <SelectValue placeholder="Industry *" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map((industry) => (
                            <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!exp.industry && (
                        <p className="text-xs text-red-500 mt-1">Required for profile completion</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Start Date"
                        value={exp.startDate || ''}
                        onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-gray-400">to</span>
                      <Input
                        placeholder="End Date"
                        value={exp.endDate || ''}
                        onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                        disabled={exp.isCurrent}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={exp.isCurrent || false}
                        onChange={(e) => {
                          updateWorkExperience(index, 'isCurrent', e.target.checked)
                          if (e.target.checked) {
                            updateWorkExperience(index, 'endDate', '')
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-600">This is my current position</span>
                    </label>
                  </div>
                  <Textarea
                    placeholder="Job description and achievements"
                    value={exp.description || ''}
                    onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                    rows={2}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="h-5 w-5" />
            <span>Skills</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(localData.skills).map(([category, skills]) => {
            if (category === 'languages') return null // Handle languages separately
            
            return (
              <div key={category}>
                <label className="text-sm font-medium capitalize">{category} Skills *</label>
                <div className="space-y-3 mt-2">
                  {(skills as string[]).map((skill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{skill}</span>
                        <button
                          onClick={() => removeSkill(category as keyof typeof localData.skills, index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Proficiency:</span>
                        <StarRating
                          value={mvpData.skillsProficiency[skill] || 0}
                          onChange={(rating) => updateSkillProficiency(skill, rating)}
                          skillName={skill}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder={`Add ${category} skill`}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const target = e.target as HTMLInputElement
                          if (target.value.trim()) {
                            addSkill(category as keyof typeof localData.skills, target.value)
                            target.value = ''
                          }
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement
                        if (input && input.value.trim()) {
                          addSkill(category as keyof typeof localData.skills, input.value)
                          input.value = ''
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                {(skills as string[]).length > 0 && Object.keys(mvpData.skillsProficiency).length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Please rate proficiency levels for all skills (required)</p>
                )}
              </div>
            )
          })}
          
          {/* Languages */}
          <div>
            <label className="text-sm font-medium">Languages *</label>
            <div className="space-y-3 mt-2">
              {localData.skills.languages?.map((lang, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{lang.name}</span>
                    <button
                      onClick={() => {
                        const updated = { ...localData }
                        updated.skills.languages?.splice(index, 1)
                        // Remove proficiency rating
                        if (mvpData.languagesProficiency[lang.name]) {
                          const updatedProficiency = { ...mvpData.languagesProficiency }
                          delete updatedProficiency[lang.name]
                          setMvpData(prev => ({ ...prev, languagesProficiency: updatedProficiency }))
                        }
                        setLocalData(updated)
                        onDataUpdate(updated)
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Proficiency:</span>
                    <StarRating
                      value={mvpData.languagesProficiency[lang.name] || 0}
                      onChange={(rating) => updateLanguageProficiency(lang.name, rating)}
                      skillName={lang.name}
                    />
                  </div>
                </div>
              ))}
              
              {/* Add new language */}
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Add language (e.g., English, Spanish)"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement
                      if (target.value.trim()) {
                        const updated = { ...localData }
                        if (!updated.skills.languages) updated.skills.languages = []
                        const languageExists = updated.skills.languages.some(lang => 
                          lang.name.toLowerCase() === target.value.toLowerCase()
                        )
                        if (!languageExists) {
                          updated.skills.languages.push({ name: target.value.trim(), proficiency: '' })
                          setLocalData(updated)
                          onDataUpdate(updated)
                          target.value = ''
                        }
                      }
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement
                    if (input && input.value.trim()) {
                      const updated = { ...localData }
                      if (!updated.skills.languages) updated.skills.languages = []
                      const languageExists = updated.skills.languages.some(lang => 
                        lang.name.toLowerCase() === input.value.toLowerCase()
                      )
                      if (!languageExists) {
                        updated.skills.languages.push({ name: input.value.trim(), proficiency: '' })
                        setLocalData(updated)
                        onDataUpdate(updated)
                        input.value = ''
                      }
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              
              {localData.skills.languages?.length === 0 && (
                <p className="text-xs text-red-500">Please add at least one language with proficiency level</p>
              )}
              {localData.skills.languages && localData.skills.languages.length > 0 && Object.keys(mvpData.languagesProficiency).length === 0 && (
                <p className="text-xs text-red-500">Please rate proficiency levels for all languages (required)</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Education */}
      {localData.education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5" />
              <span>Education ({localData.education.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {localData.education.map((edu, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4">
                  <p className="font-medium">{edu.degree || edu.institution}</p>
                  {edu.institution && edu.degree && (
                    <p className="text-sm text-gray-600">{edu.institution}</p>
                  )}
                  {(edu.startDate || edu.endDate) && (
                    <p className="text-xs text-gray-500">
                      {edu.startDate} - {edu.endDate}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onReject}>
          Start Over
        </Button>
        <Button 
          onClick={onConfirm}
          disabled={!validation.isValid}
          className="min-w-[120px]"
        >
          Confirm & Save
        </Button>
      </div>
    </div>
  )
}
