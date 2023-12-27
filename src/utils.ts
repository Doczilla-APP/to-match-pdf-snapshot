import { existsSync, statSync, writeFileSync } from 'fs'

export function sameFileSize(buffer: Buffer, filePath: string, update: 'all' | 'none' | 'missing'): boolean {
  if (!existsSync(filePath) || update === 'all' || update === 'missing') {
    writeFileSync(filePath, buffer)

    return true
  }

  return buffer.length === statSync(filePath).size
}