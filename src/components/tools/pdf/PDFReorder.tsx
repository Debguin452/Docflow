import { useState, useCallback } from 'react'
import { GripVertical, Download, RotateCcw, CheckCircle2, FileText } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import { getToolBySlug } from '../../../data/tools'
import { reorderPages, downloadBytes, formatFileSize } from '../../../lib/pdf/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile, ACCEPT } from '../../../lib/validation'

interface PageEntry { index: number; label: string; thumbnail: string | null }

async function renderThumbnails(file: File): Promise<PageEntry[]> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString()
  const ab = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: ab }).promise
  const entries: PageEntry[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const vp = page.getViewport({ scale: 0.3 })
    const canvas = document.createElement('canvas')
    canvas.width = vp.width; canvas.height = vp.height
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvasContext: ctx, viewport: vp }).promise
    entries.push({ index: i - 1, label: `Page ${i}`, thumbnail: canvas.toDataURL('image/jpeg', 0.7) })
  }
  return entries
}

export default function PDFReorder() {
  const tool = getToolBySlug('pdf-reorder')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<PageEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null)
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0]
    if (!f) return
    const v = validateFile(f, { allowedTypes: ['application/pdf'] })
    if (!v.valid) return
    setFile(f); setPages([]); setResultBytes(null); reset(); setLoading(true)
    try {
      const entries = await renderThumbnails(f)
      setPages(entries)
    } catch {
      setPages([])
    }
    setLoading(false)
  }, [reset])

  const onDragStart = (idx: number) => setDraggingIdx(idx)
  const onDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx) }
  const onDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault()
    if (draggingIdx === null || draggingIdx === targetIdx) return
    setPages(prev => {
      const a = [...prev]
      const [moved] = a.splice(draggingIdx, 1)
      a.splice(targetIdx, 0, moved)
      return a
    })
    setDraggingIdx(null); setDragOverIdx(null)
  }

  const removePage = (idx: number) => setPages(prev => prev.filter((_, i) => i !== idx))

  const handleApply = useCallback(async () => {
    if (!file || pages.length === 0) return
    trackToolUse('pdf-reorder')
    await process(async onProgress => {
      onProgress(20)
      const newOrder = pages.map(p => p.index)
      const bytes = await reorderPages(file, newOrder)
      onProgress(90)
      setResultBytes(bytes)
      onProgress(100)
    })
  }, [file, pages, process, trackToolUse])

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'Can I delete pages while reordering?', answer: 'Yes — hover a thumbnail and click the × to remove that page from the output PDF.' },
      { question: 'Does this work for large PDFs?', answer: 'Yes, but thumbnail generation may take a moment for PDFs with many pages. All processing is local.' },
      { question: 'Can I duplicate pages?', answer: 'Not directly in this tool. Use the Merge tool to combine the same PDF twice if you need to duplicate pages.' },
    ]}>
      <div className="p-6 space-y-5">
        {!file && !loading && <DropZone onFiles={handleFile} accept={ACCEPT.pdf} label="Drop your PDF here" sublabel="We'll render page thumbnails for reordering" />}

        {loading && (
          <div className="py-10 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500">Rendering page thumbnails…</p>
          </div>
        )}

        {file && pages.length > 0 && status === 'idle' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">{pages.length} pages — drag to reorder, × to remove</p>
              <button onClick={() => { setFile(null); setPages([]); reset() }} className="text-xs text-gray-400 hover:text-gray-600">Remove file</button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2 max-h-96 overflow-y-auto p-1">
              {pages.map((page, idx) => (
                <div
                  key={`${page.index}-${idx}`}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={e => onDragOver(e, idx)}
                  onDrop={e => onDrop(e, idx)}
                  onDragEnd={() => { setDraggingIdx(null); setDragOverIdx(null) }}
                  className={`relative group border rounded-lg overflow-hidden cursor-grab aspect-[3/4] bg-gray-100 select-none transition-all ${
                    dragOverIdx === idx ? 'border-primary-400 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'
                  } ${draggingIdx === idx ? 'opacity-30' : ''}`}
                >
                  {page.thumbnail ? (
                    <img src={page.thumbnail} alt={page.label} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <button
                    onClick={() => removePage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center leading-none"
                    aria-label={`Remove page ${idx + 1}`}
                  >×</button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 py-0.5 px-1">
                    <p className="text-[9px] text-white text-center">{idx + 1}</p>
                  </div>
                  <GripVertical className="absolute top-1 left-1 w-3 h-3 text-white opacity-0 group-hover:opacity-60 transition-opacity" />
                </div>
              ))}
            </div>

            <Button onClick={handleApply} className="w-full justify-center" size="lg" icon={<Download className="w-4 h-4" />}>
              Apply & Download PDF
            </Button>
          </>
        )}

        {status === 'processing' && (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm font-semibold text-gray-700">Building reordered PDF…</p>
            <ProgressBar value={progress} className="max-w-xs mx-auto" />
          </div>
        )}

        {status === 'done' && resultBytes && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-800">PDF reordered — {pages.length} pages · {formatFileSize(resultBytes.length)}</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => downloadBytes(resultBytes, file!.name.replace('.pdf', '-reordered.pdf'))}
                size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                Download PDF
              </Button>
              <Button variant="secondary" size="lg" icon={<RotateCcw className="w-4 h-4" />}
                onClick={() => { setFile(null); setPages([]); setResultBytes(null); reset() }}>
                New file
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
            <Button variant="secondary" onClick={reset} icon={<RotateCcw className="w-4 h-4" />}>Try again</Button>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
