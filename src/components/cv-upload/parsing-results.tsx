'use client'

import { useState } from 'react'
import { Check, X, Edit2, User, Briefcase, GraduationCap, Code, Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ParsedCVData } from '@/lib/cv-parser/types'

// Validation function moved here to avoid server-side imports
function validateParsedData(data: ParsedCVData): {
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

interface ParsingResultsProps {
  parsedData: ParsedCVData
  onDataUpdate: (updatedData: ParsedCVData) => void
  onConfirm: () => void
  onReject: () => void
}

export function ParsingResults({ parsedData, onDataUpdate, onConfirm, onReject }: ParsingResultsProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [localData, setLocalData] = useState<ParsedCVData>(parsedData)

  const validation = validateParsedData(localData)
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
    ;(updated.skills[category] as string[]).splice(skillIndex, 1)
    setLocalData(updated)
    onDataUpdate(updated)
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
              <h4 className="font-medium text-yellow-800 mb-2">Missing Required Information</h4>
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
          </div>
          
          <div>
            <label className="text-sm font-medium">Portfolio/LinkedIn</label>
            {editingSection === 'personal' ? (
              <Input
                value={localData.personal.portfolio || localData.personal.linkedin || ''}
                onChange={(e) => updatePersonalInfo('portfolio', e.target.value)}
                placeholder="Portfolio URL or LinkedIn profile"
              />
            ) : (
              <p className="text-sm">
                {localData.personal.portfolio || localData.personal.linkedin || 'Not found'}
              </p>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium">Professional Summary</label>
            {editingSection === 'personal' ? (
              <Textarea
                value={localData.personal.summary || ''}
                onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                placeholder="Brief professional summary"
                rows={3}
              />
            ) : (
              <p className="text-sm">{localData.personal.summary || 'Not found'}</p>
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
                    />
                    <Input
                      placeholder="Start Date"
                      value={exp.startDate || ''}
                      onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                    />
                    <Input
                      placeholder="End Date (or 'Present')"
                      value={exp.endDate || ''}
                      onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                    />
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
                <label className="text-sm font-medium capitalize">{category} Skills</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(skills as string[]).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                      <span>{skill}</span>
                      <button
                        onClick={() => removeSkill(category as keyof typeof localData.skills, index)}
                        className="ml-1 text-xs hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  <Input
                    placeholder={`Add ${category} skill`}
                    className="w-40"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement
                        addSkill(category as keyof typeof localData.skills, target.value)
                        target.value = ''
                      }
                    }}
                  />
                </div>
              </div>
            )
          })}
          
          {/* Languages */}
          <div>
            <label className="text-sm font-medium">Languages</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {localData.skills.languages?.map((lang, index) => (
                <Badge key={index} variant="outline">
                  <Globe className="h-3 w-3 mr-1" />
                  {lang.name} {lang.proficiency && `(${lang.proficiency})`}
                </Badge>
              ))}
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
