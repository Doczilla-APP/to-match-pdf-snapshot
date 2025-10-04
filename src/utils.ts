import { existsSync, statSync, writeFileSync } from 'node:fs'

export function sameFileSize(
  buffer: Buffer,
  filePath: string, update: 'all' | 'changed' | 'missing' | 'none',
  maxSizeDiffRatio?: number
): boolean {
  if (update === 'all' || !existsSync(filePath)) {
    writeFileSync(filePath, buffer)

    return true
  }

  const fileStat = statSync(filePath)

  if (maxSizeDiffRatio) {
    return Math.abs(fileStat.size - buffer.length) / fileStat.size < maxSizeDiffRatio
  }

  return buffer.length === fileStat.size
}