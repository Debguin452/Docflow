import {
  PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFRef,
  degrees, rgb, StandardFonts, PageSizes,
} from 'pdf-lib'

// ─── Compress ──────────────────────────────────────────────────────────────
// Real compression: embedded JPEG images (the bulk of most large PDFs) are
// decoded, optionally down-scaled, and re-encoded at a lower quality. Text,
// vector graphics and fonts are untouched, so text stays selectable and sharp.
export type CompressLevel = 'low' | 'medium' | 'high'

const COMPRESS_PRESETS: Record<CompressLevel, { quality: number; maxDim: number }> = {
  low:    { quality: 0.8,  maxDim: 3000 },
  medium: { quality: 0.65, maxDim: 2000 },
  high:   { quality: 0.5,  maxDim: 1400 },
}

export type JpegRecompressor = (
  bytes: Uint8Array,
  width: number,
  height: number,
  opts: { quality: number; maxDim: number },
) => Promise<{ bytes: Uint8Array; width: number; height: number } | null>

/** Browser implementation: createImageBitmap → canvas → JPEG. */
const browserRecompress: JpegRecompressor = async (bytes, width, height, { quality, maxDim }) => {
  const bitmap = await createImageBitmap(new Blob([bytes as BlobPart], { type: 'image/jpeg' }))
  try {
    const scale = Math.min(1, maxDim / Math.max(width, height))
    const w = Math.max(1, Math.round(width * scale))
    const h = Math.max(1, Math.round(height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, w, h)
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', quality))
    if (!blob) return null
    return { bytes: new Uint8Array(await blob.arrayBuffer()), width: w, height: h }
  } finally {
    bitmap.close()
  }
}

function nameValue(obj: unknown): string | undefined {
  return obj instanceof PDFName ? obj.decodeText() : undefined
}

/** Core routine, separated from the browser APIs so it can be unit-tested. */
export async function compressPDFBytes(
  input: Uint8Array | ArrayBuffer,
  level: CompressLevel,
  recompress: JpegRecompressor,
  onProgress?: (percent: number) => void,
): Promise<Uint8Array> {
  const original = input instanceof Uint8Array ? input : new Uint8Array(input)
  const pdfDoc = await PDFDocument.load(original, { updateMetadata: false })
  const { context } = pdfDoc
  const preset = COMPRESS_PRESETS[level]

  const candidates: Array<[PDFRef, PDFRawStream]> = []
  for (const [ref, obj] of context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue
    const d = obj.dict
    if (nameValue(d.get(PDFName.of('Subtype'))) !== 'Image') continue
    if (nameValue(d.get(PDFName.of('Filter'))) !== 'DCTDecode') continue          // JPEG only
    if (nameValue(d.get(PDFName.of('ColorSpace'))) !== 'DeviceRGB') continue      // skip CMYK/gray/indexed
    if (d.has(PDFName.of('Decode')) || d.has(PDFName.of('Mask'))) continue        // keep exotic images intact
    if (d.lookup(PDFName.of('ImageMask')) === context.obj(true)) continue
    candidates.push([ref, obj])
  }

  let done = 0
  for (const [ref, stream] of candidates) {
    try {
      const w = (stream.dict.get(PDFName.of('Width')) as PDFNumber | undefined)?.asNumber()
      const h = (stream.dict.get(PDFName.of('Height')) as PDFNumber | undefined)?.asNumber()
      if (w && h) {
        const out = await recompress(stream.getContents(), w, h, preset)
        // Only keep the result if it is meaningfully smaller
        if (out && out.bytes.length < stream.getContentsSize() * 0.95) {
          const dict = stream.dict.clone(context)
          dict.set(PDFName.of('Width'), PDFNumber.of(out.width))
          dict.set(PDFName.of('Height'), PDFNumber.of(out.height))
          context.assign(ref, PDFRawStream.of(dict, out.bytes))
        }
      }
    } catch {
      // A single undecodable image must never fail the whole document
    }
    done++
    onProgress?.(Math.round((done / candidates.length) * 100))
  }

  const saved = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false })
  // Never hand back something bigger than what the user gave us
  return saved.length < original.length ? saved : original
}

export async function compressPDF(
  file: File,
  level: CompressLevel = 'medium',
  onProgress?: (percent: number) => void,
): Promise<Uint8Array> {
  return compressPDFBytes(await file.arrayBuffer(), level, browserRecompress, onProgress)
}

// ─── Merge ─────────────────────────────────────────────────────────────────
export async function mergePDFs(files: File[]): Promise<Uint8Array> {
  const mergedDoc = await PDFDocument.create()
  for (const file of files) {
    const ab = await file.arrayBuffer()
    const pdf = await PDFDocument.load(ab)
    const pages = await mergedDoc.copyPages(pdf, pdf.getPageIndices())
    pages.forEach(p => mergedDoc.addPage(p))
  }
  return mergedDoc.save({ useObjectStreams: true })
}

// ─── Split ─────────────────────────────────────────────────────────────────
export async function splitPDF(
  file: File,
  ranges: Array<{ start: number; end: number }>,
): Promise<Uint8Array[]> {
  const ab = await file.arrayBuffer()
  const srcDoc = await PDFDocument.load(ab)
  const results: Uint8Array[] = []
  for (const range of ranges) {
    const newDoc = await PDFDocument.create()
    const indices: number[] = []
    for (let i = range.start - 1; i < range.end; i++) {
      if (i >= 0 && i < srcDoc.getPageCount()) indices.push(i)
    }
    const pages = await newDoc.copyPages(srcDoc, indices)
    pages.forEach(p => newDoc.addPage(p))
    results.push(await newDoc.save({ useObjectStreams: true }))
  }
  return results
}

export async function splitPDFEveryPage(file: File): Promise<Uint8Array[]> {
  const ab = await file.arrayBuffer()
  const srcDoc = await PDFDocument.load(ab)
  const count = srcDoc.getPageCount()
  const results: Uint8Array[] = []
  for (let i = 0; i < count; i++) {
    const newDoc = await PDFDocument.create()
    const [page] = await newDoc.copyPages(srcDoc, [i])
    newDoc.addPage(page)
    results.push(await newDoc.save({ useObjectStreams: true }))
  }
  return results
}

// ─── Rotate ────────────────────────────────────────────────────────────────
export async function rotatePDF(
  file: File,
  rotation: 90 | 180 | 270,
  pageIndices?: number[],
): Promise<Uint8Array> {
  const ab = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(ab)
  const pages = pdfDoc.getPages()
  const toRotate = pageIndices ?? pages.map((_, i) => i)
  toRotate.forEach(i => {
    if (i < pages.length) {
      const current = pages[i].getRotation().angle
      pages[i].setRotation(degrees((current + rotation) % 360))
    }
  })
  return pdfDoc.save({ useObjectStreams: true })
}

// ─── Extract pages ─────────────────────────────────────────────────────────
export async function extractPages(file: File, pageIndices: number[]): Promise<Uint8Array> {
  const ab = await file.arrayBuffer()
  const srcDoc = await PDFDocument.load(ab)
  const newDoc = await PDFDocument.create()
  const pages = await newDoc.copyPages(srcDoc, pageIndices)
  pages.forEach(p => newDoc.addPage(p))
  return newDoc.save({ useObjectStreams: true })
}

// ─── Reorder pages ─────────────────────────────────────────────────────────
export async function reorderPages(file: File, newOrder: number[]): Promise<Uint8Array> {
  const ab = await file.arrayBuffer()
  const srcDoc = await PDFDocument.load(ab)
  const newDoc = await PDFDocument.create()
  const pages = await newDoc.copyPages(srcDoc, newOrder)
  pages.forEach(p => newDoc.addPage(p))
  return newDoc.save({ useObjectStreams: true })
}

// ─── Unlock ────────────────────────────────────────────────────────────────
// pdf-lib cannot decrypt PDFs (it has no password option), so decryption is
// done with pdf.js. Pages are re-rendered into a fresh, unencrypted PDF.
// If the file is not encrypted at all it is simply re-saved with pdf-lib.
export async function unlockPDF(file: File, password: string): Promise<Uint8Array> {
  const ab = await file.arrayBuffer()

  // Not encrypted? Just re-save (this also strips nothing, but is lossless).
  try {
    const plain = await PDFDocument.load(ab.slice(0))
    return plain.save({ useObjectStreams: true })
  } catch {
    // encrypted → fall through to pdf.js
  }

  const { loadPdfJs } = await import('./pdfjs')
  const pdfjsLib = await loadPdfJs()
  let pdf
  try {
    pdf = await pdfjsLib.getDocument({ data: new Uint8Array(ab), password }).promise
  } catch (err) {
    const name = (err as { name?: string } | null)?.name
    if (name === 'PasswordException') {
      throw new Error('Incorrect password. Please check the password and try again.')
    }
    throw new Error('Could not open this PDF. It may be corrupted or use an unsupported encryption.')
  }

  const out = await PDFDocument.create()
  const SCALE = 2
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: SCALE })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvasContext: ctx, viewport }).promise
    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob(b => (b ? res(b) : rej(new Error('Canvas export failed'))), 'image/jpeg', 0.92),
    )
    const img = await out.embedJpg(new Uint8Array(await blob.arrayBuffer()))
    const p = out.addPage([viewport.width / SCALE, viewport.height / SCALE])
    p.drawImage(img, { x: 0, y: 0, width: viewport.width / SCALE, height: viewport.height / SCALE })
  }
  return out.save({ useObjectStreams: true })
}

// ─── Watermark ─────────────────────────────────────────────────────────────
export async function addTextWatermark(
  file: File,
  text: string,
  options: {
    opacity?: number
    fontSize?: number
    color?: [number, number, number]
    rotation?: number
  } = {},
): Promise<Uint8Array> {
  const ab = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(ab)
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const pages = pdfDoc.getPages()
  const { opacity = 0.15, fontSize = 60, color = [0.5, 0.5, 0.5] as [number, number, number], rotation = -45 } = options

  pages.forEach(page => {
    const { width, height } = page.getSize()
    const textWidth = font.widthOfTextAtSize(text, fontSize)
    const textHeight = font.heightAtSize(fontSize)
    const rad = (rotation * Math.PI) / 180
    // drawText rotates around the text origin (bottom-left), so offset the
    // origin such that the centre of the text lands on the page centre.
    const cx = textWidth / 2
    const cy = textHeight / 2
    page.drawText(text, {
      x: width / 2 - (cx * Math.cos(rad) - cy * Math.sin(rad)),
      y: height / 2 - (cx * Math.sin(rad) + cy * Math.cos(rad)),
      size: fontSize,
      font,
      color: rgb(color[0], color[1], color[2]),
      opacity,
      rotate: degrees(rotation),
    })
  })
  return pdfDoc.save({ useObjectStreams: true })
}

// ─── Metadata ──────────────────────────────────────────────────────────────
export async function editMetadata(
  file: File,
  metadata: { title?: string; author?: string; subject?: string; keywords?: string; creator?: string },
): Promise<Uint8Array> {
  const ab = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(ab)
  if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title)
  if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author)
  if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject)
  if (metadata.keywords !== undefined) pdfDoc.setKeywords([metadata.keywords])
  if (metadata.creator !== undefined) pdfDoc.setCreator(metadata.creator)
  pdfDoc.setModificationDate(new Date())
  return pdfDoc.save({ useObjectStreams: true })
}

export async function getMetadata(file: File): Promise<{
  title?: string; author?: string; subject?: string; keywords?: string; pageCount: number; fileSize: number
}> {
  const ab = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(ab)
  const kw = pdfDoc.getKeywords()
  return {
    title: pdfDoc.getTitle(),
    author: pdfDoc.getAuthor(),
    subject: pdfDoc.getSubject(),
    keywords: Array.isArray(kw) ? kw.join(', ') : (kw ?? undefined),
    pageCount: pdfDoc.getPageCount(),
    fileSize: file.size,
  }
}

// ─── Images to PDF ─────────────────────────────────────────────────────────
export async function imagesToPDF(
  imageFiles: File[],
  pageSize: [number, number] = PageSizes.A4 as [number, number],
  fit: 'fit' | 'fill' | 'stretch' = 'fit',
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  for (const imageFile of imageFiles) {
    const ab = await imageFile.arrayBuffer()
    const bytes = new Uint8Array(ab)
    let image
    const type = imageFile.type
    if (type === 'image/jpeg' || type === 'image/jpg') {
      image = await pdfDoc.embedJpg(bytes)
    } else if (type === 'image/png') {
      image = await pdfDoc.embedPng(bytes)
    } else {
      const pngBytes = await convertImageToPNG(imageFile)
      image = await pdfDoc.embedPng(pngBytes)
    }
    const page = pdfDoc.addPage(pageSize)
    const { width: pw, height: ph } = page.getSize()
    const { width: iw, height: ih } = image
    let drawWidth = pw, drawHeight = ph, x = 0, y = 0
    if (fit === 'fit') {
      const scale = Math.min(pw / iw, ph / ih)
      drawWidth = iw * scale; drawHeight = ih * scale
      x = (pw - drawWidth) / 2; y = (ph - drawHeight) / 2
    }
    page.drawImage(image, { x, y, width: drawWidth, height: drawHeight })
  }
  return pdfDoc.save({ useObjectStreams: true })
}

// ─── Text to PDF ───────────────────────────────────────────────────────────
export async function textToPDF(
  text: string,
  options: { fontSize?: number; margin?: number; title?: string; pageSize?: [number, number] } = {},
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const { fontSize = 12, margin = 50, pageSize = PageSizes.A4 as [number, number] } = options
  const lines = text.split('\n')
  const [pageWidth, pageHeight] = pageSize
  const usableWidth = pageWidth - margin * 2
  const lineHeight = fontSize * 1.4
  const linesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight)

  const wrappedLines: string[] = []
  for (const line of lines) {
    if (!line.trim()) { wrappedLines.push(''); continue }
    const words = line.split(' ')
    let currentLine = ''
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const width = font.widthOfTextAtSize(testLine, fontSize)
      if (width > usableWidth && currentLine) {
        wrappedLines.push(currentLine); currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) wrappedLines.push(currentLine)
  }

  for (let pageStart = 0; pageStart < wrappedLines.length; pageStart += linesPerPage) {
    const page = pdfDoc.addPage(pageSize)
    const pageLines = wrappedLines.slice(pageStart, pageStart + linesPerPage)
    pageLines.forEach((line, idx) => {
      if (!line) return
      page.drawText(line, {
        x: margin,
        y: pageHeight - margin - (idx + 1) * lineHeight,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
    })
  }

  if (options.title) pdfDoc.setTitle(options.title)
  return pdfDoc.save({ useObjectStreams: true })
}

// ─── Helpers ───────────────────────────────────────────────────────────────
export function downloadBytes(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export async function getPageCount(file: File): Promise<number> {
  const ab = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(ab)
  return pdfDoc.getPageCount()
}

async function convertImageToPNG(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width; canvas.height = img.height
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Canvas conversion failed'))
        blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf)))
      }, 'image/png')
      URL.revokeObjectURL(url)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
    img.src = url
  })
  }
    
