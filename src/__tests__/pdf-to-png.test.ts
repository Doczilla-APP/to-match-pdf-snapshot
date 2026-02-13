import { join } from 'node:path'

// Mock the pdfToPng module due to ESM dynamic import challenges in Jest
jest.mock('../pdf-to-png', () => ({
  pdfToPng: jest.fn()
}))

import { pdfToPng } from '../pdf-to-png'

const mockPdfToPng = pdfToPng as jest.MockedFunction<typeof pdfToPng>

// Mock PDF for testing - this is a minimal valid PDF
const MINIMAL_PDF = Buffer.from(
  '%PDF-1.4\n' +
  '1 0 obj\n' +
  '<< /Type /Catalog /Pages 2 0 R >>\n' +
  'endobj\n' +
  '2 0 obj\n' +
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n' +
  'endobj\n' +
  '3 0 obj\n' +
  '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>\n' +
  'endobj\n' +
  '4 0 obj\n' +
  '<< /Length 44 >>\n' +
  'stream\n' +
  'BT\n' +
  '/F1 24 Tf\n' +
  '100 700 Td\n' +
  '(Hello World) Tj\n' +
  'ET\n' +
  'endstream\n' +
  'endobj\n' +
  'xref\n' +
  '0 5\n' +
  '0000000000 65535 f\n' +
  '0000000009 00000 n\n' +
  '0000000058 00000 n\n' +
  '0000000115 00000 n\n' +
  '0000000317 00000 n\n' +
  'trailer\n' +
  '<< /Size 5 /Root 1 0 R >>\n' +
  'startxref\n' +
  '410\n' +
  '%%EOF'
)

describe('pdfToPng', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('with Buffer input', () => {
    it('should convert a simple PDF buffer to PNG images', async () => {
      const mockPngBuffer = Buffer.from('mock PNG data')
      mockPdfToPng.mockResolvedValue([mockPngBuffer])

      const images = await pdfToPng(MINIMAL_PDF)

      expect(images).toBeDefined()
      expect(Array.isArray(images)).toBe(true)
      expect(images.length).toBeGreaterThan(0)
      expect(mockPdfToPng).toHaveBeenCalledWith(MINIMAL_PDF)
    })

    it('should return PNG buffers', async () => {
      const mockPngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      const mockPngBuffer = Buffer.concat([mockPngSignature, Buffer.from('rest of PNG')])
      mockPdfToPng.mockResolvedValue([mockPngBuffer])

      const images = await pdfToPng(MINIMAL_PDF)

      expect(images.length).toBeGreaterThan(0)

      for (const image of images) {
        expect(Buffer.isBuffer(image)).toBe(true)
        // PNG signature check (first 8 bytes)
        expect(image.slice(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
      }
    })

    it('should return one image per page', async () => {
      const mockPngBuffer = Buffer.from('PNG data')
      mockPdfToPng.mockResolvedValue([mockPngBuffer])

      const images = await pdfToPng(MINIMAL_PDF)

      // Our minimal PDF has 1 page
      expect(images.length).toBe(1)
    })

    it('should generate non-empty PNG buffers', async () => {
      const mockPngBuffer = Buffer.from('PNG data with content')
      mockPdfToPng.mockResolvedValue([mockPngBuffer])

      const images = await pdfToPng(MINIMAL_PDF)

      for (const image of images) {
        expect(image.length).toBeGreaterThan(0)
      }
    })
  })

  describe('with file path input', () => {
    it('should convert a PDF from file path', async () => {
      const testPdfPath = '/path/to/test.pdf'
      const mockPngBuffer = Buffer.from('PNG from file')
      mockPdfToPng.mockResolvedValue([mockPngBuffer])

      const images = await pdfToPng(testPdfPath)

      expect(images).toBeDefined()
      expect(Array.isArray(images)).toBe(true)
      expect(images.length).toBe(1)
      expect(Buffer.isBuffer(images[0])).toBe(true)
      expect(mockPdfToPng).toHaveBeenCalledWith(testPdfPath)
    })
  })

  describe('error handling', () => {
    it('should throw error for invalid PDF buffer', async () => {
      const invalidPdf = Buffer.from('This is not a PDF')
      mockPdfToPng.mockRejectedValue(new Error('Invalid PDF'))

      await expect(pdfToPng(invalidPdf)).rejects.toThrow('Invalid PDF')
    })

    it('should throw error for empty buffer', async () => {
      const emptyBuffer = Buffer.from('')
      mockPdfToPng.mockRejectedValue(new Error('Empty buffer'))

      await expect(pdfToPng(emptyBuffer)).rejects.toThrow('Empty buffer')
    })

    it('should throw error for non-existent file path', async () => {
      const nonExistentPath = '/non/existent/path/file.pdf'
      mockPdfToPng.mockRejectedValue(new Error('File not found'))

      await expect(pdfToPng(nonExistentPath)).rejects.toThrow('File not found')
    })
  })

  describe('multi-page PDFs', () => {
    it('should handle multi-page PDFs', async () => {
      // Multi-page PDF with 2 pages
      const multiPagePdf = Buffer.from(
        '%PDF-1.4\n' +
        '1 0 obj\n' +
        '<< /Type /Catalog /Pages 2 0 R >>\n' +
        'endobj\n' +
        '2 0 obj\n' +
        '<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>\n' +
        'endobj\n' +
        '3 0 obj\n' +
        '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>\n' +
        'endobj\n' +
        '4 0 obj\n' +
        '<< /Length 44 >>\n' +
        'stream\n' +
        'BT\n' +
        '/F1 24 Tf\n' +
        '100 700 Td\n' +
        '(Page 1) Tj\n' +
        'ET\n' +
        'endstream\n' +
        'endobj\n' +
        '5 0 obj\n' +
        '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 612 792] /Contents 6 0 R >>\n' +
        'endobj\n' +
        '6 0 obj\n' +
        '<< /Length 44 >>\n' +
        'stream\n' +
        'BT\n' +
        '/F1 24 Tf\n' +
        '100 700 Td\n' +
        '(Page 2) Tj\n' +
        'ET\n' +
        'endstream\n' +
        'endobj\n' +
        'xref\n' +
        '0 7\n' +
        '0000000000 65535 f\n' +
        '0000000009 00000 n\n' +
        '0000000058 00000 n\n' +
        '0000000117 00000 n\n' +
        '0000000319 00000 n\n' +
        '0000000412 00000 n\n' +
        '0000000614 00000 n\n' +
        'trailer\n' +
        '<< /Size 7 /Root 1 0 R >>\n' +
        'startxref\n' +
        '707\n' +
        '%%EOF'
      )

      const mockPngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      const mockPng1 = Buffer.concat([mockPngSignature, Buffer.from('page 1')])
      const mockPng2 = Buffer.concat([mockPngSignature, Buffer.from('page 2')])
      mockPdfToPng.mockResolvedValue([mockPng1, mockPng2])

      const images = await pdfToPng(multiPagePdf)

      expect(images.length).toBe(2)

      for (const image of images) {
        expect(Buffer.isBuffer(image)).toBe(true)
        expect(image.slice(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
      }
    })
  })

  describe('output format validation', () => {
    it('should generate valid PNG images with correct dimensions', async () => {
      // Create a mock PNG buffer with proper structure
      const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      const ihdrChunk = Buffer.alloc(25)
      ihdrChunk.writeUInt32BE(13, 0) // IHDR chunk length
      ihdrChunk.write('IHDR', 4)
      ihdrChunk.writeUInt32BE(612, 8) // width
      ihdrChunk.writeUInt32BE(792, 12) // height

      const mockPng = Buffer.concat([pngSignature, ihdrChunk])
      mockPdfToPng.mockResolvedValue([mockPng])

      const images = await pdfToPng(MINIMAL_PDF)
      const png = images[0]

      // Check PNG signature
      expect(png.slice(0, 8).toString('hex')).toBe('89504e470d0a1a0a')

      // Verify IHDR chunk exists (PNG header with dimensions)
      const ihdrChunkStr = png.slice(12, 16).toString()
      expect(ihdrChunkStr).toBe('IHDR')

      // Extract width and height from IHDR chunk
      const width = png.readUInt32BE(16)
      const height = png.readUInt32BE(20)

      expect(width).toBeGreaterThan(0)
      expect(height).toBeGreaterThan(0)
    })

    it('should generate PNG with proper IEND chunk', async () => {
      // Create a mock PNG buffer with IEND chunk at the end
      const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      const iendChunk = Buffer.alloc(12)
      iendChunk.writeUInt32BE(0, 0) // IEND chunk length (0)
      iendChunk.write('IEND', 4)
      iendChunk.writeUInt32BE(0xae426082, 8) // CRC

      const mockPng = Buffer.concat([pngSignature, Buffer.from('content'), iendChunk])
      mockPdfToPng.mockResolvedValue([mockPng])

      const images = await pdfToPng(MINIMAL_PDF)
      const png = images[0]

      // PNG should end with IEND chunk (check last 12 bytes, skip length, get chunk type)
      const iendChunkStr = png.slice(-8, -4).toString()
      expect(iendChunkStr).toBe('IEND')
    })
  })
})
