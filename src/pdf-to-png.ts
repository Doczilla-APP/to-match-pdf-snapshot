/**
 * https://github.com/mozilla/pdf.js/blob/3b94e9fdce616a9b4899800559cbca15169acca6/examples/node/pdf2png/pdf2png.mjs
 */
import * as Canvas from 'canvas'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
// @ts-expect-error
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'

const PDFJS_DIR = dirname(require.resolve('pdfjs-dist'))
const C_MAP_URL = join(PDFJS_DIR, '../cmaps/')

// Where the standard fonts are located.
const STANDARD_FONT_DATA_URL = join(PDFJS_DIR, '../standard_fonts/')

export async function pdfToPng(
  pdf: string | Buffer
): Promise<Buffer[]> {
  // Load PDF
  const data = new Uint8Array(Buffer.isBuffer(pdf) ? pdf : readFileSync(pdf))
  const loadingTask = pdfjsLib.getDocument({
    data,
    cMapUrl: C_MAP_URL,
    cMapPacked: true,
    standardFontDataUrl: STANDARD_FONT_DATA_URL
  })

  const pdfDocument = await loadingTask.promise
  const numPages = pdfDocument.numPages

  // Generate images
  const images: Buffer[] = []
  for (let page = 1; page <= numPages; page += 1) {
    const pdfPage = await pdfDocument.getPage(page)

    const viewport = pdfPage.getViewport({ scale: 1.0 })
    const canvasAndContext = Canvas.createCanvas(viewport.width, viewport.height)

    await pdfPage.render({
      canvasContext: canvasAndContext.getContext('2d') as never,
      viewport
    }).promise

    pdfPage.cleanup()

    images.push(canvasAndContext.toBuffer('image/png'))
  }

  return images
}
