// Text Extraction from different file formats

import * as mammoth from 'mammoth'

export interface ExtractedText {
  content: string
  metadata?: Record<string, unknown>
}

export class TextExtractor {
  /**
   * Extract text from PDF files using pdfjs-dist
   */
  static async extractFromPDF(buffer: Buffer): Promise<ExtractedText> {
    // PDF extraction is handled server-side via API route
    console.log('📄 PDF extraction called - this should be handled server-side')
    
    return {
      content: 'PDF extraction should be handled via API route /api/cv-parse',
      metadata: {
        note: 'Client-side PDF extraction not implemented',
        size: buffer.length,
        type: 'pdf'
      }
    }
  }

  /**
   * Extract text from DOCX files
   */
  static async extractFromDOCX(buffer: Buffer): Promise<ExtractedText> {
    try {
      const result = await mammoth.extractRawText({ buffer })
      return {
        content: result.value,
        metadata: {
          messages: result.messages
        }
      }
    } catch (error) {
      throw new Error(`DOCX parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Extract text from plain text files
   */
  static async extractFromTXT(buffer: Buffer): Promise<ExtractedText> {
    try {
      const content = buffer.toString('utf-8')
      return {
        content,
        metadata: {
          encoding: 'utf-8',
          size: buffer.length
        }
      }
    } catch (error) {
      throw new Error(`Text file parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Auto-detect file type and extract text
   */
  static async extractText(buffer: Buffer, mimeType: string): Promise<ExtractedText> {
    switch (mimeType) {
      case 'application/pdf':
        return this.extractFromPDF(buffer)
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return this.extractFromDOCX(buffer)
      
      case 'text/plain':
        return this.extractFromTXT(buffer)
      
      default:
        // Try to detect by content
        if (buffer.subarray(0, 4).toString() === '%PDF') {
          return this.extractFromPDF(buffer)
        }
        
        // Try as text if nothing else works
        try {
          return this.extractFromTXT(buffer)
        } catch {
          throw new Error(`Unsupported file type: ${mimeType}`)
        }
    }
  }
}
