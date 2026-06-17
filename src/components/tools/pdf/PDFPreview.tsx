import { useState, useCallback, useRef } from 'react'
import { Eye, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import { getToolBySlug } from '../../../data/tools'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile, ACCEPT, formatFileSize } from '../../../lib/validation'

interface PageCache { [pageNum: number]: string }

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

export default function PDFPreview() {
  const tool = getToolBySlug('pdf-preview')!
  const { trackToolUse } = useAnalytics()
  const [file, setFile] = useState<File | null>(null)
  const [pdf, setPdf] = useState<unknown>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.4)
  const [pageImage, setPageImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const cacheRef = useRef<PageCache>({})

  const loadPDF = useCallback(async (f: File) => {
    setLoading(true); cacheRef.current = {}
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString()
    const ab = await f.arrayBuffer()
    const doc = await pdfjsLib.getDocument({ data: ab }).promise
    setPdf(doc); setTotalPages(doc.numPages); setCurrentPage(1)
    const img = await renderPage(doc, 1, scale)
    cacheRef.current[1] = img
    setPageImage(img); setLoading(false)
    trackToolUse('pdf-preview')
  }, [scale, trackToolUse])

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0]; if (!f) return
    if (!validateFile(f, { allowedTypes: ['application/pdf'] }).valid) return
    setFile(f); setPdf(null); setPageImage(null); setTotalPages(0)
    await loadPDF(f)
  }, [loadPDF])

  const goToPage = useCallback(async (num: number) => {
    if (!pdf || num < 1 || num > totalPages) return
    setCurrentPage(num); setLoading(true)
    if (cacheRef.current[num]) {
      setPageImage(cacheRef.current[num]); setLoading(false); return
    }
    const img = await renderPage(pdf, num, scale)
    cacheRef.current[num] = img
    setPageImage(img); setLoading(false)
  }, [pdf, totalPages, scale])

  const changeZoom = useCallback(async (delta: number) => {
    const newScale = Math.max(0.5, Math.min(3.0, scale + delta))
    setScale(newScale)
    if (!pdf || !currentPage) return
    cacheRef.current = {}
    setLoading(true)
    const img = await renderPage(pdf, currentPage, newScale)
    cacheRef.current[currentPage] = img
    setPageImage(img); setLoading(false)
  }, [pdf, currentPage, scale])

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
              <button onClick={() => { setFile(null); setPdf(null); setPageImage(null); setTotalPages(0) }}
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
                  src={pageImage}
                  alt={`Page ${currentPage}`}
                  className="max-w-full shadow-md"
                  style={{ imageRendering: 'crisp-edges' }}
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
