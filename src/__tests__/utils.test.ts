import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { sameFileSize } from '../utils'

const TEST_DIR = join(__dirname, '__test-temp__')

describe('sameFileSize', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true })
    }
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true })
    }
  })

  describe('update mode: "all"', () => {
    it('should write file and return true when file does not exist', () => {
      const buffer = Buffer.from('test content')
      const filePath = join(TEST_DIR, 'new-file.txt')

      const result = sameFileSize(buffer, filePath, 'all')

      expect(result).toBe(true)
      expect(existsSync(filePath)).toBe(true)
      expect(readFileSync(filePath).toString()).toBe('test content')
    })

    it('should overwrite existing file and return true', () => {
      const filePath = join(TEST_DIR, 'existing-file.txt')
      const buffer1 = Buffer.from('original content')
      const buffer2 = Buffer.from('new content')

      sameFileSize(buffer1, filePath, 'all')
      const result = sameFileSize(buffer2, filePath, 'all')

      expect(result).toBe(true)
      expect(readFileSync(filePath).toString()).toBe('new content')
    })
  })

  describe('update mode: "missing"', () => {
    it('should write file and return true when file does not exist', () => {
      const buffer = Buffer.from('test content')
      const filePath = join(TEST_DIR, 'missing-file.txt')

      const result = sameFileSize(buffer, filePath, 'missing')

      expect(result).toBe(true)
      expect(existsSync(filePath)).toBe(true)
      expect(readFileSync(filePath).toString()).toBe('test content')
    })

    it('should return true when file exists with same size', () => {
      const buffer = Buffer.from('same size')
      const filePath = join(TEST_DIR, 'same-size.txt')

      sameFileSize(buffer, filePath, 'all')
      const result = sameFileSize(buffer, filePath, 'missing')

      expect(result).toBe(true)
    })

    it('should return false when file exists with different size', () => {
      const buffer1 = Buffer.from('original')
      const buffer2 = Buffer.from('different size content')
      const filePath = join(TEST_DIR, 'diff-size.txt')

      sameFileSize(buffer1, filePath, 'all')
      const result = sameFileSize(buffer2, filePath, 'missing')

      expect(result).toBe(false)
      expect(readFileSync(filePath).toString()).toBe('original')
    })
  })

  describe('update mode: "changed"', () => {
    it('should write file and return true when file does not exist', () => {
      const buffer = Buffer.from('test content')
      const filePath = join(TEST_DIR, 'changed-file.txt')

      const result = sameFileSize(buffer, filePath, 'changed')

      expect(result).toBe(true)
      expect(existsSync(filePath)).toBe(true)
    })

    it('should return true when file has same size', () => {
      const buffer = Buffer.from('test1234')
      const filePath = join(TEST_DIR, 'same.txt')

      sameFileSize(buffer, filePath, 'all')
      const result = sameFileSize(buffer, filePath, 'changed')

      expect(result).toBe(true)
    })

    it('should return false when file has different size', () => {
      const buffer1 = Buffer.from('short')
      const buffer2 = Buffer.from('much longer content')
      const filePath = join(TEST_DIR, 'different.txt')

      sameFileSize(buffer1, filePath, 'all')
      const result = sameFileSize(buffer2, filePath, 'changed')

      expect(result).toBe(false)
    })
  })

  describe('update mode: "none"', () => {
    it('should write file and return true when file does not exist', () => {
      const buffer = Buffer.from('content')
      const filePath = join(TEST_DIR, 'none-file.txt')

      const result = sameFileSize(buffer, filePath, 'none')

      expect(result).toBe(true)
      expect(existsSync(filePath)).toBe(true)
    })

    it('should return true when sizes match exactly', () => {
      const buffer = Buffer.from('exactly same')
      const filePath = join(TEST_DIR, 'exact.txt')

      sameFileSize(buffer, filePath, 'all')
      const result = sameFileSize(buffer, filePath, 'none')

      expect(result).toBe(true)
    })

    it('should return false when sizes differ by 1 byte', () => {
      const buffer1 = Buffer.from('test')
      const buffer2 = Buffer.from('test2')
      const filePath = join(TEST_DIR, 'one-byte-diff.txt')

      sameFileSize(buffer1, filePath, 'all')
      const result = sameFileSize(buffer2, filePath, 'none')

      expect(result).toBe(false)
    })
  })

  describe('maxSizeDiffRatio parameter', () => {
    it('should return true when size difference is within ratio', () => {
      const buffer1 = Buffer.from('0'.repeat(100))
      const buffer2 = Buffer.from('0'.repeat(105)) // 5% larger
      const filePath = join(TEST_DIR, 'ratio-test.txt')

      sameFileSize(buffer1, filePath, 'all')
      const result = sameFileSize(buffer2, filePath, 'none', 0.1) // 10% tolerance

      expect(result).toBe(true)
    })

    it('should return false when size difference exceeds ratio', () => {
      const buffer1 = Buffer.from('0'.repeat(100))
      const buffer2 = Buffer.from('0'.repeat(120)) // 20% larger
      const filePath = join(TEST_DIR, 'ratio-exceed.txt')

      sameFileSize(buffer1, filePath, 'all')
      const result = sameFileSize(buffer2, filePath, 'none', 0.1) // 10% tolerance

      expect(result).toBe(false)
    })

    it('should handle smaller buffers within ratio', () => {
      const buffer1 = Buffer.from('0'.repeat(100))
      const buffer2 = Buffer.from('0'.repeat(95)) // 5% smaller
      const filePath = join(TEST_DIR, 'ratio-smaller.txt')

      sameFileSize(buffer1, filePath, 'all')
      const result = sameFileSize(buffer2, filePath, 'none', 0.1) // 10% tolerance

      expect(result).toBe(true)
    })

    it('should use absolute value for size difference', () => {
      const buffer1 = Buffer.from('0'.repeat(100))
      const buffer2 = Buffer.from('0'.repeat(85)) // 15% smaller
      const filePath = join(TEST_DIR, 'ratio-abs.txt')

      sameFileSize(buffer1, filePath, 'all')
      const result = sameFileSize(buffer2, filePath, 'none', 0.1) // 10% tolerance

      expect(result).toBe(false)
    })

    it('should work with "changed" update mode', () => {
      const buffer1 = Buffer.from('0'.repeat(100))
      const buffer2 = Buffer.from('0'.repeat(108))
      const filePath = join(TEST_DIR, 'ratio-changed.txt')

      sameFileSize(buffer1, filePath, 'all')
      const result = sameFileSize(buffer2, filePath, 'changed', 0.1)

      expect(result).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle empty buffers', () => {
      const buffer = Buffer.from('')
      const filePath = join(TEST_DIR, 'empty.txt')

      const result = sameFileSize(buffer, filePath, 'all')

      expect(result).toBe(true)
      expect(statSync(filePath).size).toBe(0)
    })

    it('should handle large buffers', () => {
      const buffer = Buffer.from('0'.repeat(1024 * 1024)) // 1MB
      const filePath = join(TEST_DIR, 'large.txt')

      const result = sameFileSize(buffer, filePath, 'all')

      expect(result).toBe(true)
      expect(statSync(filePath).size).toBe(1024 * 1024)
    })

    it('should return true with maxSizeDiffRatio of 0 for exact match', () => {
      const buffer = Buffer.from('exact')
      const filePath = join(TEST_DIR, 'zero-ratio.txt')

      sameFileSize(buffer, filePath, 'all')
      const result = sameFileSize(buffer, filePath, 'none', 0)

      expect(result).toBe(true)
    })

    it('should return false with maxSizeDiffRatio of 0 for any difference', () => {
      const buffer1 = Buffer.from('test')
      const buffer2 = Buffer.from('test1')
      const filePath = join(TEST_DIR, 'zero-ratio-diff.txt')

      sameFileSize(buffer1, filePath, 'all')
      const result = sameFileSize(buffer2, filePath, 'none', 0)

      expect(result).toBe(false)
    })
  })
})
