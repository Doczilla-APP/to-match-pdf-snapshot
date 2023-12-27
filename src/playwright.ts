import { expect, test } from '@playwright/test'
// @ts-expect-error
import { calculateSha1, sanitizeForFilePath } from 'playwright-core/lib/utils'
import { sameFileSize } from './utils'
import { pdfToPng } from './pdf-to-png'

type ToMatchSnapShotOptions = {
  /**
   * An acceptable ratio of pixels that are different to the total amount of pixels, between `0` and `1`. Default is
   * configurable with `TestConfig.expect`. Unset by default.
   */
  maxDiffPixelRatio?: number

  /**
   * An acceptable amount of pixels that could be different. Default is configurable with `TestConfig.expect`. Unset by
   * default.
   */
  maxDiffPixels?: number

  /**
   * Snapshot name. If not passed, the test name and ordinals are used when called multiple times.
   */
  name?: string

  /**
   * An acceptable perceived color difference in the [YIQ color space](https://en.wikipedia.org/wiki/YIQ) between the
   * same pixel in compared images, between zero (strict) and one (lax), default is configurable with
   * `TestConfig.expect`. Defaults to `0.2`.
   */
  threshold?: number
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PlaywrightTest {
    interface Matchers<R> {
      toMatchPdfSnapshot(options: ToMatchSnapShotOptions): R
    }
  }
}

function trimLongString(s: string, length = 100) {
  if (s.length <= length) {
    return s
  }

  const hash = calculateSha1(s)
  const middle = `-${hash.substring(0, 5)}-`
  const start = Math.floor((length - middle.length) / 2)
  const end = length - middle.length - start
  return s.substring(0, start) + middle + s.slice(-end)
}

expect.extend({
  async toMatchPdfSnapshot(
    pdfFile: Buffer,
    options?: ToMatchSnapShotOptions
  ) {
    const testInfo = test.info()

    if (!testInfo) {
      throw new Error(`toMatchPdfSnapshot() must be called during the test`)
    }

    const fullTitleWithoutSpec = options?.name
      ? options?.name
      : testInfo.titlePath.slice(1).join(' ')

    const pdfSnapshotName = fullTitleWithoutSpec.toLowerCase().endsWith('.pdf')
      ? fullTitleWithoutSpec
      : `${sanitizeForFilePath(trimLongString(fullTitleWithoutSpec))}.pdf`

    if (!sameFileSize(pdfFile, testInfo.snapshotPath(pdfSnapshotName), testInfo.config.updateSnapshots)) {
      return {
        pass: false,
        name: 'toMatchPdfSnapshot',
        message: () => 'Does not match with snapshot, size is different.'
      }
    }

    const images = await pdfToPng(pdfFile)

    let pass
    try {
      for (let i = 0; i < images.length; i++) {
        expect(images[i]).toMatchSnapshot({
          ...options,
          name: `${pdfSnapshotName}${i > 0 || images.length > 1 ? `.${i}` : ''}.png`
        })
      }
      pass = true

    } catch {
      pass = false
    }

    return {
      pass,
      name: 'toMatchPdfSnapshot',
      message: () => 'Does not match with snapshot.'
    }
  }
})