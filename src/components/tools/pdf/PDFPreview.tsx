import { useState, useCallback, useRef, useEffect } from 'react'
import { Eye, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import { getToolBySlug } from '../../../data/tools'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { loadPdfJs } from '../../../lib/pdf/pdfjs'
import { validateFile, ACCEPT, formatFileSize } from '../../../lib/validation'
import { LRU } from '../../../lib/async'

async function renderPage(pdf: unknown, pageNum: number, scale: number): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDoc = pdf as any
  const page = await pdfDoc.getPage(pageNum)
  const vp = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = vp.width; canvas.height = vp.height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({ canvasContext: ctx, viewport: vp }).promise
  return canvas.toDataURL('image/jpeg', 0.85)
}

interface PdfDocLike { numPages: number; destroy: () => Promise<void> | void }

export default function PDFPreview() {
  const tool = getToolBySlug('pdf-preview')!
  const { trackToolUse } = useAnalytics()
  const [file, setFile] = useState<File | null>(null)
  const [pdf, setPdf] = useState<PdfDocLike | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.4)
  const [pageImage, setPageImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Rendered pages keyed by "page@scale". Bounded so a 500-page PDF can't exhaust memory.
  const cacheRef = useRef(new LRU<string, string>(12))
  // Only the most recent navigation may update the screen (prevents stale-page flashes)
  const navToken = useRef(0)
  const pdfRef = useRef<PdfDocLike | null>(null)

  const closePdf = useCallback(() => {
    navToken.current++
    void pdfRef.current?.destroy()
    pdfRef.current = null
    cacheRef.current.clear()
  }, [])

  useEffect(() => closePdf, [closePdf])

  const showPage = useCallback(async (doc: PdfDocLike, num: number, sc: number) => {
    const token = ++navToken.current
    const key = `${num}@${sc}`
    const hit = cacheRef.current.get(key)
    if (hit) { setPageImage(hit); setLoading(false) }
    else {
      setLoading(true)
      const img = await renderPage(doc, num, sc)
      cacheRef.current.set(key, img)
      if (token !== navToken.current) return // user already moved on
      setPageImage(img); setLoading(false)
    }
    // Quietly pre-render the next page so "next" feels instant
    if (num < doc.numPages) {
      const nextKey = `${num + 1}@${sc}`
      if (!cacheRef.current.has(nextKey)) {
        renderPage(doc, num + 1, sc).then(img => cacheRef.current.set(nextKey, img)).catch(() => {})
      }
    }
  }, [])

  const loadPDF = useCallback(async (f: File) => {
    closePdf()
    setLoading(true)
    try {
      const pdfjsLib = await loadPdfJs()
      const doc = (await pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise) as unknown as PdfDocLike
      pdfRef.current = doc
      setPdf(doc); setTotalPages(doc.numPages); setCurrentPage(1)
      await showPage(doc, 1, scale)
      trackToolUse('pdf-preview')
    } catch {
      setLoading(false)
    }
  }, [closePdf, scale, showPage, trackToolUse])

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0]; if (!f) return
    if (!validateFile(f, { allowedTypes: ['application/pdf'] }).valid) return
    setFile(f); setPdf(null); setPageImage(null); setTotalPages(0)
    await loadPDF(f)
  }, [loadPDF])

  const goToPage = useCallback((num: number) => {
    if (!pdf || !Number.isFinite(num) || num < 1 || num > totalPages) return
    setCurrentPage(num)
    void showPage(pdf, num, scale)
  }, [pdf, totalPages, scale, showPage])

  const changeZoom = useCallback((delta: number) => {
    const next = Math.round(Math.max(0.5, Math.min(3.0, scale + delta)) * 10) / 10
    if (next === scale) return
    setScale(next)
    if (pdf) void showPage(pdf, currentPage, next)
  }, [pdf, currentPage, scale, showPage])

  // ← / → turn pages, +/- zoom (the on-screen hint promises this)
  useEffect(() => {
    if (!pdf) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goToPage(currentPage + 1) }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goToPage(currentPage - 1) }
      else if (e.key === '+' || e.key === '=') changeZoom(0.2)
      else if (e.key === '-') changeZoom(-0.2)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pdf, currentPage, goToPage, changeZoom])

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'Can I search text in the preview?', answer: 'Text search is not available in the preview. This tool is for visual review of pages. For text extraction, use the OCR tool.' },
      { question: 'Does preview work for all PDF types?', answer: 'Yes — text PDFs, image PDFs, and scanned documents all render correctly.' },
      { question: 'Is there a page limit for preview?', answer: 'No page limit. Large PDFs render one page at a time for performance, with previously viewed pages cached in memory.' },
    ]}>
      <div className="p-6 space-y-4">
        {!file && (
          <DropZone onFiles={handleFile} accept={ACCEPT.pdf} label="Drop your PDF to preview" sublabel="View all pages with zoom and navigation — no upload" />
        )}

        {file && (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-gray-500 flex-1 min-w-0">
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate font-medium text-gray-700">{file.name}</span>
                <span className="shrink-0">· {formatFileSize(file.size)}</span>
              </div>
              <button onClick={() => { closePdf(); setFile(null); setPdf(null); setPageImage(null); setTotalPages(0) }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                Close
              </button>
            </div>

            {/* Navigation bar */}
            {totalPages > 0 && (
              <div className="flex items-center justify-between gap-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-1">
                  <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}
                    className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors" aria-label="Previous page">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1.5 text-sm">
                    <input type="number" min={1} max={totalPages} value={currentPage}
                      onChange={e => goToPage(parseInt(e.target.value, 10))}
                      className="w-12 text-center px-1 py-0.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                      aria-label="Current page" />
                    <span className="text-gray-400">/ {totalPages}</span>
                  </div>
                  <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}
                    className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors" aria-label="Next page">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => changeZoom(-0.2)}
                    className="p-1.5 rounded hover:bg-gray-200 transition-colors" aria-label="Zoom out">
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-600 w-12 text-center">{Math.round(scale * 100)}%</span>
                  <button onClick={() => changeZoom(0.2)}
                    className="p-1.5 rounded hover:bg-gray-200 transition-colors" aria-label="Zoom in">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Page display */}
            <div className="border border-gray-200 rounded-xl bg-gray-100 overflow-auto min-h-[400px] max-h-[70vh] flex items-center justify-center">
              {loading && (
                <div className="flex flex-col items-center gap-3 text-gray-400">
                  <div className="w-7 h-7 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">{pdf ? 'Rendering page…' : 'Loading PDF…'}</p>
                  {!pdf && <p className="text-xs">First load downloads the renderer (~3 MB, cached)</p>}
                </div>
              )}
              {!loading && pageImage && (
                <img
                  key={currentPage}
                  src={pageImage}
                  alt={`Page ${currentPage}`}
                  className="max-w-full shadow-md animate-fade-in"
                />
              )}
            </div>

            {/* Keyboard hint */}
            {totalPages > 1 && (
              <p className="text-center text-xs text-gray-400">
                Use ← → arrow keys or the controls above to navigate pages
              </p>
            )}
          </>
        )}
      </div>
    </ToolLayout>
  )
}
