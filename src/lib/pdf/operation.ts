import { PDFDocument, degrees, rgb, StandardFonts, PageSizes } from 'pdf-lib'

// ─── Compress ──────────────────────────────────────────────────────────────
export async function compressPDF(
  file: File,
  level: 'low' | 'medium' | 'high' = 'medium',
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  return pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: level === 'high' ? 50 : level === 'medium' ? 20 : 10,
  })
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
export async function unlockPDF(file: File, password: string): Promise<Uint8Array> {
  const ab = await file.arrayBuffer()
  try {
    // pdf-lib accepts password via LoadOptions
    const pdfDoc = await PDFDocument.load(ab, { password } as Parameters<typeof PDFDocument.load>[1])
    return pdfDoc.save({ useObjectStreams: true })
  } catch {
    throw new Error('Incorrect password or the file is not password-protected.')
  }
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
    page.drawText(text, {
      x: width / 2 - (text.length * fontSize) / 4,
      y: height / 2,
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
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
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
    img.onerror = reject
    img.src = url
  })
  }
    
