import { existsSync, statSync, writeFileSync } from 'node:fs'

export function sameFileSize(buffer: Buffer, filePath: string, update: 'all' | 'none' | 'missing'): boolean {
  if (update === 'all' || !existsSync(filePath)) {
    writeFileSync(filePath, buffer)

    return true
  }

  return buffer.length === statSync(filePath).size
}