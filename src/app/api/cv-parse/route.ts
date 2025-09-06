// API Route for CV Parsing - Server-side processing

import { NextRequest, NextResponse } from 'next/server'
import { CVParser } from '@/lib/cv-parser'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse the CV
    const result = await CVParser.parseCV(buffer, file.type, {
      includeRawText: true,
      strictParsing: false
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('CV parsing error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        processingTime: 0
      },
      { status: 500 }
    )
  }
}

// Configure the API route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
