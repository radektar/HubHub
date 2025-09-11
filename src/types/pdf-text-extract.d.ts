declare module 'pdf-text-extract' {
  function pdfExtract(filePath: string, callback: (err: Error | null, pages: string[]) => void): void
  function pdfExtract(filePath: string, options: unknown, callback: (err: Error | null, pages: string[]) => void): void
  export = pdfExtract
}
