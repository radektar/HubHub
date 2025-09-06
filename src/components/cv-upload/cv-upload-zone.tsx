'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CVParserResult } from '@/lib/cv-parser/types'

interface CVUploadZoneProps {
  onParsingComplete: (result: CVParserResult) => void
  onParsingStart: () => void
  disabled?: boolean
}

export function CVUploadZone({ onParsingComplete, onParsingStart, disabled }: CVUploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsUploading(true)
    setUploadError(null)
    setUploadedFile(file)
    onParsingStart()

    try {
      // Create FormData for API request
      const formData = new FormData()
      formData.append('file', file)

      // Send to parsing API
      const response = await fetch('/api/cv-parse', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      onParsingComplete(result)

      if (!result.success) {
        setUploadError(result.error || 'Failed to parse CV')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred'
      setUploadError(errorMessage)
      onParsingComplete({
        success: false,
        error: errorMessage,
        processingTime: 0
      })
    } finally {
      setIsUploading(false)
    }
  }, [onParsingComplete, onParsingStart])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: disabled || isUploading
  })

  const resetUpload = () => {
    setUploadedFile(null)
    setUploadError(null)
    setIsUploading(false)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive && !isDragReject ? 'border-blue-400 bg-blue-50' : ''}
            ${isDragReject ? 'border-red-400 bg-red-50' : ''}
            ${!isDragActive ? 'border-gray-300 hover:border-gray-400' : ''}
            ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center space-y-4">
            {isUploading ? (
              <>
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900">Processing your CV...</p>
                  <p className="text-sm text-gray-500">This may take a few seconds</p>
                  {uploadedFile && (
                    <p className="text-sm text-gray-400 mt-1">
                      Analyzing: {uploadedFile.name}
                    </p>
                  )}
                </div>
              </>
            ) : uploadedFile && !uploadError ? (
              <>
                <CheckCircle className="h-12 w-12 text-green-500" />
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900">CV Uploaded Successfully</p>
                  <p className="text-sm text-gray-500">{uploadedFile.name}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetUpload}
                    className="mt-2"
                  >
                    Upload Different CV
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
                  {isDragReject ? (
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  ) : (
                    <Upload className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900">
                    {isDragActive
                      ? isDragReject
                        ? 'File type not supported'
                        : 'Drop your CV here'
                      : 'Upload your CV'
                    }
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Drag and drop your CV file here, or click to browse
                  </p>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>PDF</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>DOCX</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>TXT</span>
                  </div>
                </div>

                <p className="text-xs text-gray-400">
                  Maximum file size: 10MB
                </p>
              </>
            )}
          </div>
        </div>

        {uploadError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm font-medium text-red-800">Upload Error</p>
            </div>
            <p className="text-sm text-red-700 mt-1">{uploadError}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetUpload}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
