// Text Extraction from different file formats

import * as pdfjs from 'pdfjs-dist'

export interface ExtractedText {
  content: string
  metadata?: Record<string, unknown>
}

export class TextExtractor {
  /**
   * Extract text from PDF files using pdfjs-dist
   */
  static async extractFromPDF(buffer: Buffer): Promise<ExtractedText> {
    try {
      // Configure pdfjs worker
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
      
      // Load PDF document
      const loadingTask = pdfjs.getDocument({
        data: buffer,
        useSystemFonts: true
      })
      
      const pdf = await loadingTask.promise
      let fullText = ''
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        // Combine text items
        const pageText = textContent.items
          .map((item: { str: string }) => item.str)
          .join(' ')
        
        fullText += pageText + '\n'
      }
      
      return {
        content: fullText.trim(),
        metadata: {
          pages: pdf.numPages,
          size: buffer.length,
          type: 'pdf'
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
