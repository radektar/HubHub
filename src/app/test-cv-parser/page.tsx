'use client'

import { useState } from 'react'
import { CVUploadZone } from '@/components/cv-upload/cv-upload-zone'
import { ParsingResults } from '@/components/cv-upload/parsing-results'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CVParserResult, ParsedCVData } from '@/lib/cv-parser/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

enum TestStep {
  UPLOAD = 'upload',
  REVIEW = 'review'
}

export default function TestCVParserPage() {
  const [currentStep, setCurrentStep] = useState<TestStep>(TestStep.UPLOAD)
  const [parsingResult, setParsingResult] = useState<CVParserResult | null>(null)
  const [parsedData, setParsedData] = useState<ParsedCVData | null>(null)
  const [testResults, setTestResults] = useState<any[]>([])

  const handleParsingStart = () => {
    setParsingResult(null)
    setParsedData(null)
    console.log('🚀 Starting CV parsing...')
  }

  const handleParsingComplete = (result: CVParserResult) => {
    console.log('📄 Parsing completed:', result)
    setParsingResult(result)
    
    if (result.success && result.data) {
      setParsedData(result.data)
      setCurrentStep(TestStep.REVIEW)
      
      // Add to test results
      const testResult = {
        timestamp: new Date().toISOString(),
        success: result.success,
        confidence: result.data.confidence,
        processingTime: result.processingTime,
        personalInfo: {
          name: result.data.personal.name,
          email: result.data.personal.email,
          phone: result.data.personal.phone
        },
        workExperience: result.data.workExperience.length,
        skills: Object.values(result.data.skills).flat().length,
        education: result.data.education.length
      }
      
      setTestResults(prev => [testResult, ...prev.slice(0, 4)]) // Keep last 5 results
    }
  }

  const handleDataUpdate = (updatedData: ParsedCVData) => {
    setParsedData(updatedData)
    console.log('✏️ Data updated:', updatedData)
  }

  const handleTestComplete = () => {
    console.log('✅ Test completed - data ready for database integration')
    console.log('Final parsed data:', parsedData)
    alert('Test completed! Check console for detailed results.')
  }

  const handleReset = () => {
    setCurrentStep(TestStep.UPLOAD)
    setParsingResult(null)
    setParsedData(null)
  }

  const downloadTestData = () => {
    if (parsedData) {
      const dataStr = JSON.stringify(parsedData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cv-parsed-data-${Date.now()}.json`
      link.click()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CV Parser Test Environment</h1>
              <p className="text-gray-600 mt-2">
                Test CV parsing functionality without authentication. Upload CVs and verify extraction accuracy.
              </p>
            </div>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
              🧪 TEST MODE
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {currentStep === TestStep.UPLOAD && (
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
                        The CV parsing encountered an error. Check the details below.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-700 font-medium">Error Details:</p>
                        <p className="text-sm text-red-600 mt-1">{parsingResult.error}</p>
                        <p className="text-xs text-red-500 mt-2">
                          Processing time: {parsingResult.processingTime}ms
                        </p>
                      </div>
                      <Button 
                        onClick={handleReset} 
                        className="mt-4"
                        variant="outline"
                      >
                        Try Another CV
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {currentStep === TestStep.REVIEW && parsedData && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Parsing Test Results</span>
                      <div className="flex space-x-2">
                        <Button onClick={downloadTestData} variant="outline" size="sm">
                          Download JSON
                        </Button>
                        <Button onClick={handleReset} variant="outline" size="sm">
                          Test Another CV
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(parsedData.confidence * 100)}%
                        </div>
                        <div className="text-sm text-gray-500">Confidence</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {parsingResult?.processingTime}ms
                        </div>
                        <div className="text-sm text-gray-500">Processing Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {parsedData.workExperience.length}
                        </div>
                        <div className="text-sm text-gray-500">Work Experiences</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {Object.values(parsedData.skills).flat().length}
                        </div>
                        <div className="text-sm text-gray-500">Skills Found</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <ParsingResults
                  parsedData={parsedData}
                  onDataUpdate={handleDataUpdate}
                  onConfirm={handleTestComplete}
                  onReject={handleReset}
                />
              </div>
            )}
          </div>

          {/* Test Results Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Session Results</CardTitle>
                <CardDescription>
                  Recent parsing attempts and their performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No tests run yet. Upload a CV to start testing.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {testResults.map((result, index) => (
                      <div key={index} className="border rounded-lg p-3 text-sm">
                        <div className="flex justify-between items-center mb-2">
                          <Badge 
                            variant={result.success ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {result.success ? "Success" : "Failed"}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        {result.success && (
                          <div className="space-y-1 text-xs text-gray-600">
                            <div>Confidence: {Math.round(result.confidence * 100)}%</div>
                            <div>Time: {result.processingTime}ms</div>
                            <div>Name: {result.personalInfo.name || 'Not found'}</div>
                            <div>Email: {result.personalInfo.email || 'Not found'}</div>
                            <div>Work Exp: {result.workExperience}</div>
                            <div>Skills: {result.skills}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Testing Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>PDF parsing works</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>DOCX parsing works</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>Personal info extracted</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>Work experience found</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>Skills categorized</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>Education extracted</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>Validation works</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>Data editing works</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => console.clear()} 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  Clear Console
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  Reset Session
                </Button>
                <a 
                  href="https://supabase.com/dashboard/project/onvekvladcenwdqlmjtw" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    Open Supabase Dashboard
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

