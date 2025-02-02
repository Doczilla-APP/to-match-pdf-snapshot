/**
 * https://github.com/mozilla/pdf.js/blob/3b94e9fdce616a9b4899800559cbca15169acca6/examples/node/pdf2png/pdf2png.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const PDFJS_DIR = join(dirname(require.resolve('pdfjs-dist')), '..')

export async function pdfToPng(
  pdf: string | Buffer
): Promise<Buffer[]> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')

  // Load PDF
  const data = new Uint8Array(Buffer.isBuffer(pdf) ? pdf : readFileSync(pdf))
  const loadingTask = getDocument({
    data,
    // Where the standard fonts are located.
    standardFontDataUrl: join(PDFJS_DIR, 'standard_fonts/'),
    // Some PDFs need external cmaps.
    cMapUrl: join(PDFJS_DIR, 'cmaps/'),
    cMapPacked: true
  })

  const pdfDocument = await loadingTask.promise
  const numPages = pdfDocument.numPages

  // Generate images
  const images: Buffer[] = []
  for (let page = 1; page <= numPages; page += 1) {
    const pdfPage = await pdfDocument.getPage(page)
    const canvasFactory = pdfDocument.canvasFactory

    const viewport = pdfPage.getViewport({ scale: 1.0 })
    // @ts-expect-error unknown method on Object
    const canvasAndContext = canvasFactory.create(viewport.width, viewport.height)

    await pdfPage.render({
      canvasContext: canvasAndContext.context,
      viewport
    }).promise

    images.push(canvasAndContext.canvas.toBuffer('image/png'))
    pdfPage.cleanup()
  }

  return images
}
