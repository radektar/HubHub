// Text Extraction from different file formats

import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

export interface ExtractedText {
  content: string
  metadata?: Record<string, any>
}

export class TextExtractor {
  /**
   * Extract text from PDF files
   */
  static async extractFromPDF(buffer: Buffer): Promise<ExtractedText> {
    try {
      const data = await pdfParse(buffer)
      return {
        content: data.text,
        metadata: {
          pages: data.numpages,
          info: data.info,
          version: data.version
        }
      }
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
