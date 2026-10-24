import { useState, useCallback } from 'react'
import { Monitor, Download, RotateCcw, CheckCircle2, GripVertical, Trash2 } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import Select from '../../ui/Select'
import { getToolBySlug } from '../../../data/tools'
import { imagesToPDF, downloadBytes, formatFileSize } from '../../../lib/pdf/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile } from '../../../lib/validation'
import { PageSizes } from 'pdf-lib'

interface Entry { file: File; id: string; preview: string }

const PAGE_SIZE_OPTS = [
  { value: 'match', label: 'Match screenshot size' },
  { value: 'A4', label: 'A4 (210 × 297 mm)' },
  { value: 'Letter', label: 'US Letter (8.5 × 11 in)' },
]

export default function ScreenshotToPDF() {
  const tool = getToolBySlug('screenshot-to-pdf')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [entries, setEntries] = useState<Entry[]>([])
  const [pageSize, setPageSize] = useState('match')
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null)
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const addFiles = useCallback((files: File[]) => {
    const types = ['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/bmp']
    const valid = files.filter(f => validateFile(f, { allowedTypes: types }).valid)
    const newEntries = valid.map(f => ({ file: f, id: crypto.randomUUID(), preview: URL.createObjectURL(f) }))
    setEntries(prev => [...prev, ...newEntries])
    setResultBytes(null); reset()
  }, [reset])

  const removeEntry = (id: string) => {
    setEntries(prev => { const e = prev.find(x => x.id === id); if (e) URL.revokeObjectURL(e.preview); return prev.filter(x => x.id !== id) })
  }

  const onDragStart = (idx: number) => setDraggingIdx(idx)
  const onDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx) }
  const onDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault()
    if (draggingIdx === null || draggingIdx === targetIdx) return
    setEntries(prev => { const a = [...prev]; const [m] = a.splice(draggingIdx, 1); a.splice(targetIdx, 0, m); return a })
    setDraggingIdx(null); setDragOverIdx(null)
  }

  const handleConvert = useCallback(async () => {
    if (!entries.length) return
    trackToolUse('screenshot-to-pdf')
    await process(async onProgress => {
      onProgress(10)
      let size: [number, number]
      if (pageSize === 'A4') size = PageSizes.A4 as [number, number]
      else if (pageSize === 'Letter') size = PageSizes.Letter as [number, number]
      else {
        // Use first screenshot's dimensions in points (96 dpi → 72pt scale)
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image(); i.onload = () => resolve(i); i.onerror = reject
          i.src = entries[0].preview
        })
        size = [img.width * 0.75, img.height * 0.75] // px → pt
      }
      const bytes = await imagesToPDF(entries.map(e => e.file), size, pageSize === 'match' ? 'fill' : 'fit')
      onProgress(90)
      setResultBytes(bytes)
      onProgress(100)
    })
  }, [entries, pageSize, process, trackToolUse])

  const baseName = entries[0]?.file.name.replace(/\.[^.]+$/, '') ?? 'screenshots'

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'What is the difference between Screenshot to PDF and Images to PDF?', answer: 'Screenshot to PDF defaults to matching your screenshot\'s native dimensions. It\'s optimized for screen captures rather than print layout.' },
      { question: 'How do I capture a screenshot to upload?', answer: 'Use your OS screenshot tool (Print Screen on Windows, Cmd+Shift+4 on macOS), then upload the saved image file.' },
      { question: 'Will the text in screenshots be selectable in the PDF?', answer: 'No. Screenshots are images, so text is not machine-readable in the PDF. Use the OCR tool to extract text from screenshot images first.' },
    ]}>
      <div className="p-6 space-y-5">
        <DropZone onFiles={addFiles}
          accept={{ 'image/*': ['.jpg','.jpeg','.png','.webp','.gif','.bmp'] }}
          multiple label="Drop screenshots here" sublabel="PNG, JPG, WEBP — each screenshot becomes one PDF page" />

        {entries.length > 0 && status !== 'processing' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">{entries.length} screenshot{entries.length !== 1 ? 's' : ''} — drag to reorder</p>
              <button onClick={() => { entries.forEach(e => URL.revokeObjectURL(e.preview)); setEntries([]); setResultBytes(null); reset() }}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors">Clear all</button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto">
              {entries.map((entry, idx) => (
                <div key={entry.id}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={e => onDragOver(e, idx)}
                  onDrop={e => onDrop(e, idx)}
                  onDragEnd={() => { setDraggingIdx(null); setDragOverIdx(null) }}
                  className={`flex items-center gap-3 p-2.5 border rounded-lg bg-white transition-all cursor-grab select-none ${dragOverIdx === idx ? 'border-primary-400 bg-primary-50' : 'border-gray-200'} ${draggingIdx === idx ? 'opacity-30' : ''}`}>
                  <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                  <img src={entry.preview} alt="" className="w-12 h-8 object-cover rounded border border-gray-200 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{entry.file.name}</p>
                    <p className="text-xs text-gray-400">{formatFileSize(entry.file.size)}</p>
                  </div>
                  <span className="text-xs text-gray-400 font-mono shrink-0">p.{idx + 1}</span>
                  <button onClick={() => removeEntry(entry.id)} className="text-gray-300 hover:text-red-500 transition-colors" aria-label="Remove">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <Select label="Page size" options={PAGE_SIZE_OPTS} value={pageSize}
              onChange={e => { setPageSize(e.target.value); setResultBytes(null); reset() }} />

            {status === 'idle' && (
              <Button onClick={handleConvert} className="w-full justify-center" size="lg" icon={<Monitor className="w-4 h-4" />}>
                Convert {entries.length} screenshot{entries.length !== 1 ? 's' : ''} to PDF
              </Button>
            )}
          </>
        )}

        {status === 'processing' && (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm font-semibold text-gray-700">Building PDF…</p>
            <ProgressBar value={progress} className="max-w-xs mx-auto" />
          </div>
        )}

        {status === 'done' && resultBytes && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">PDF created</p>
                <p className="text-xs text-emerald-600">{entries.length} page{entries.length !== 1 ? 's' : ''} · {formatFileSize(resultBytes.length)}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => downloadBytes(resultBytes!, `${baseName}.pdf`)}
                size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                Download PDF
              </Button>
              <Button variant="secondary" size="lg" icon={<RotateCcw className="w-4 h-4" />}
                onClick={() => { entries.forEach(e => URL.revokeObjectURL(e.preview)); setEntries([]); setResultBytes(null); reset() }}>
                New conversion
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
