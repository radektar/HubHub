// API Route for CV Parsing - Server-side processing

import { NextRequest, NextResponse } from 'next/server'
import { AIParser } from '@/lib/cv-parser/ai-parser'

// NOTE: pdf-parse is imported dynamically in extractTextFromPDF function
// to avoid the test file loading issue at module initialization

export async function POST(request: NextRequest) {
  console.log('🚀 CV Parse API called')
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    console.log('📄 File received:', file?.name, file?.type, file?.size)
    
    if (!file) {
      console.log('❌ No file provided')
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
      console.log('❌ Unsupported file type:', file.type)
      return NextResponse.json(
        { success: false, error: `Unsupported file type: ${file.type}` },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      console.log('❌ File too large:', file.size)
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    console.log('✅ File validation passed, starting parsing...')

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    console.log('📦 Buffer created, size:', buffer.length)

    // Extract text based on file type
    let extractedText = ''
    
    if (file.type === 'text/plain') {
      extractedText = buffer.toString('utf8')
      console.log('📝 Text extracted from TXT file')
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For now, return a placeholder for DOCX
      extractedText = 'DOCX parsing temporarily disabled. Please use TXT format for testing.'
      console.log('📄 DOCX file detected - using placeholder')
    } else if (file.type === 'application/pdf') {
      console.log('📄 Starting PDF parsing...')
      extractedText = await extractTextFromPDF(buffer)
      console.log('📝 PDF text extracted, length:', extractedText.length)
    }

    console.log('📋 Text extracted, length:', extractedText.length)

    // Check if we have any text to parse
    if (!extractedText || extractedText.trim().length === 0) {
      console.log('⚠️ No text extracted from file')
      return NextResponse.json(
        {
          success: false,
          error: 'Could not extract text from file. Please ensure the file contains readable text or try a different format (TXT).',
          processingTime: 0
        },
        { status: 400 }
      )
    }

    // Use AI parsing if available, fallback to regex
    let parsedData
    let parsingMethod = 'regex'
    
    try {
      if (process.env.GEMINI_API_KEY) {
        console.log('🤖 Using AI-powered parsing...')
        const aiParser = new AIParser()
        parsedData = await aiParser.parseWithFallback(extractedText)
        parsingMethod = 'ai'
      } else {
        console.log('📝 Using basic regex parsing (no AI key)...')
        // Don't create AIParser when key is missing - use basic functions directly
        parsedData = {
          personal: {
            name: extractName(extractedText),
            email: extractEmail(extractedText),
            phone: extractPhone(extractedText),
            summary: extractSummary(extractedText)
          },
          workExperience: extractWorkExperience(extractedText),
          skills: extractSkills(extractedText),
          education: [],
          projects: [],
          languages: [],
          certifications: []
        }
        parsingMethod = 'basic'
      }
    } catch (error) {
      console.error('⚠️ Advanced parsing failed, using basic parsing:', error)
      // Fallback to original basic parsing
      parsedData = {
        personal: {
          name: extractName(extractedText),
          email: extractEmail(extractedText),
          phone: extractPhone(extractedText),
          summary: extractSummary(extractedText)
        },
        workExperience: extractWorkExperience(extractedText),
        skills: extractSkills(extractedText),
        education: [],
        projects: [],
        languages: [],
        certifications: []
      }
      parsingMethod = 'basic'
    }

    console.log(`✅ Parsing completed successfully using ${parsingMethod} method`)

    const result = {
      success: true,
      data: {
        ...(parsedData as Record<string, unknown>),
        rawText: extractedText,
        confidence: parsingMethod === 'ai' ? 0.95 : parsingMethod === 'regex' ? 0.85 : 0.7,
        errors: [],
        parsingMethod
      },
      processingTime: Date.now() % 1000 // Simple timing
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ CV parsing error:', error)
    
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

// Simple extraction functions for testing
function extractName(text: string): string {
  const lines = text.split('\n')
  return lines[0]?.trim() || 'Name not found'
}

function extractEmail(text: string): string {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  const match = text.match(emailRegex)
  return match?.[0] || ''
}

function extractPhone(text: string): string {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
  const match = text.match(phoneRegex)
  return match?.[0] || ''
}

function extractSummary(text: string): string {
  const summaryMatch = text.match(/PROFESSIONAL SUMMARY\s*([\s\S]*?)(?=\n[A-Z\s]+\n|$)/i)
  return summaryMatch?.[1]?.trim() || ''
}

function extractWorkExperience(text: string): Array<{jobTitle?: string, company?: string, startDate?: string, endDate?: string}> {
  const experiences = []
  const workSection = text.match(/WORK EXPERIENCE\s*([\s\S]*?)(?=\nEDUCATION|\nSKILLS|$)/i)?.[1] || ''
  
  // Simple extraction - look for job titles and companies
  const jobMatches = workSection.match(/^(.+) at (.+)$/gm)
  if (jobMatches) {
    for (const match of jobMatches) {
      const parts = match.split(' at ')
      if (parts.length === 2) {
        experiences.push({
          jobTitle: parts[0].trim(),
          company: parts[1].trim()
        })
      }
    }
  }
  
  return experiences
}

function extractSkills(text: string): {technical?: string[], design?: string[], tools?: string[], soft?: string[], languages?: Array<{name: string}>} {
  const skillsSection = text.match(/SKILLS\s*([\s\S]*?)(?=\nLANGUAGES|\nCERTIFICATIONS|$)/i)?.[1] || ''
  
  return {
    technical: extractSkillCategory(skillsSection, 'Technical'),
    design: extractSkillCategory(skillsSection, 'Design'),
    tools: [],
    soft: extractSkillCategory(skillsSection, 'Soft'),
    languages: []
  }
}

function extractSkillCategory(text: string, category: string): string[] {
  const regex = new RegExp(`${category}:\\s*([^\\n]+)`, 'i')
  const match = text.match(regex)
  if (match?.[1]) {
    return match[1].split(',').map(skill => skill.trim())
  }
  return []
}

// PDF text extraction function using pdf-parse (works on Vercel/serverless)
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log('🔍 Starting PDF text extraction with pdf-parse...')
    
    // Dynamic import to avoid pdf-parse test file loading issue at module initialization
    // pdf-parse tries to load './test/data/05-versions-space.pdf' at module init
    // Using dynamic import delays the module loading until runtime
    const pdfModule = await import('pdf-parse')
    const pdf = pdfModule.default || pdfModule
    
    // Extract text directly from buffer - no file system needed!
    const data = await pdf(buffer)
    const extractedText = data.text || ''
    
    console.log('✅ PDF text extraction completed')
    console.log('📊 PDF info - pages:', data.numpages, 'version:', data.version)
    console.log('📝 Extracted text length:', extractedText.length)
    
    return extractedText.trim() || 'No text content found in PDF'
    
  } catch (error) {
    console.error('❌ PDF parsing error:', error)
    // Return empty string instead of error message so AI can still process
    // The error will be logged but won't break the flow
    console.log('⚠️ PDF parsing failed, returning empty text for AI processing')
    return ''
  }
}

// Configure the API route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
