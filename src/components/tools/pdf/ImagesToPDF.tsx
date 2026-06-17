import { useState, useCallback } from 'react'
import { FileImage, Download, RotateCcw, CheckCircle2, GripVertical, Trash2 } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import Select from '../../ui/Select'
import { getToolBySlug } from '../../../data/tools'
import { imagesToPDF, downloadBytes, formatFileSize } from '../../../lib/pdf/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { PageSizes } from 'pdf-lib'
import { validateFile } from '../../../lib/validation'

interface ImageEntry { file: File; id: string; preview: string }

const PAGE_SIZE_OPTIONS = [
  { value: 'A4', label: 'A4 (210 × 297 mm)' },
  { value: 'Letter', label: 'US Letter (8.5 × 11 in)' },
  { value: 'A3', label: 'A3 (297 × 420 mm)' },
  { value: 'Legal', label: 'US Legal (8.5 × 14 in)' },
]

const FIT_OPTIONS = [
  { value: 'fit', label: 'Fit to page (keep aspect ratio)' },
  { value: 'fill', label: 'Fill page (may crop)' },
  { value: 'stretch', label: 'Stretch to fill exactly' },
]

const PAGE_SIZE_MAP: Record<string, [number, number]> = {
  A4: PageSizes.A4 as [number, number],
  Letter: PageSizes.Letter as [number, number],
  A3: PageSizes.A3 as [number, number],
  Legal: PageSizes.Legal as [number, number],
}

export default function ImagesToPDF() {
  const tool = getToolBySlug('images-to-pdf')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [entries, setEntries] = useState<ImageEntry[]>([])
  const [pageSize, setPageSize] = useState('A4')
  const [fit, setFit] = useState<'fit' | 'fill' | 'stretch'>('fit')
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null)
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const addFiles = useCallback((files: File[]) => {
    const imgTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']
    const valid = files.filter(f => validateFile(f, { allowedTypes: imgTypes }).valid)
    const newEntries = valid.map(f => ({
      file: f,
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      preview: URL.createObjectURL(f),
    }))
    setEntries(prev => [...prev, ...newEntries])
    setResultBytes(null); reset()
  }, [reset])

  const removeEntry = (id: string) => {
    setEntries(prev => {
      const entry = prev.find(e => e.id === id)
      if (entry) URL.revokeObjectURL(entry.preview)
      return prev.filter(e => e.id !== id)
    })
  }

  const onDragStart = (idx: number) => setDraggingIdx(idx)
  const onDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx) }
  const onDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault()
    if (draggingIdx === null || draggingIdx === targetIdx) return
    setEntries(prev => {
      const a = [...prev]
      const [moved] = a.splice(draggingIdx, 1)
      a.splice(targetIdx, 0, moved)
      return a
    })
    setDraggingIdx(null); setDragOverIdx(null)
  }

  const handleConvert = useCallback(async () => {
    if (entries.length === 0) return
    trackToolUse('images-to-pdf')
    await process(async onProgress => {
      onProgress(10)
      const size = PAGE_SIZE_MAP[pageSize] ?? PageSizes.A4 as [number, number]
      const bytes = await imagesToPDF(entries.map(e => e.file), size, fit)
      onProgress(95)
      setResultBytes(bytes)
      onProgress(100)
    })
  }, [entries, pageSize, fit, process, trackToolUse])

  const baseName = entries[0]?.file.name.replace(/\.[^.]+$/, '') ?? 'images'

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'What image formats are supported?', answer: 'JPG, PNG, WEBP, GIF, and BMP. Each image becomes one page in the PDF.' },
      { question: 'Can I control the page order?', answer: 'Yes — drag and drop the images in the list to reorder them before converting.' },
      { question: 'What page size should I use?', answer: 'A4 is the international standard used in most countries. US Letter is standard in North America. Choose based on your intended printing region.' },
    ]}>
      <div className="p-6 space-y-5">
        <DropZone
          onFiles={addFiles}
          accept={{ 'image/*': ['.jpg','.jpeg','.png','.webp','.gif','.bmp'] }}
          multiple
          label="Drop images here"
          sublabel="JPG, PNG, WEBP, GIF, BMP — each image becomes one page"
        />

        {entries.length > 0 && status !== 'processing' && (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {entries.map((entry, idx) => (
                <div
                  key={entry.id}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={e => onDragOver(e, idx)}
                  onDrop={e => onDrop(e, idx)}
                  onDragEnd={() => { setDraggingIdx(null); setDragOverIdx(null) }}
                  className={`relative group border rounded-lg overflow-hidden cursor-grab aspect-[3/4] bg-gray-100 transition-all ${
                    dragOverIdx === idx ? 'border-primary-400 scale-105' : 'border-gray-200'
                  } ${draggingIdx === idx ? 'opacity-40' : ''}`}
                >
                  <img src={entry.preview} alt={entry.file.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-black/40">
                    <p className="text-[9px] text-white text-center">{idx + 1}</p>
                  </div>
                  <GripVertical className="absolute top-1 left-1 w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-70 transition-opacity" />
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Select label="Page size" options={PAGE_SIZE_OPTIONS} value={pageSize} onChange={e => setPageSize(e.target.value)} />
              <Select label="Image fit" options={FIT_OPTIONS} value={fit} onChange={e => setFit(e.target.value as 'fit' | 'fill' | 'stretch')} />
            </div>

            {status === 'idle' && (
              <Button onClick={handleConvert} className="w-full justify-center" size="lg" icon={<FileImage className="w-4 h-4" />}>
                Convert {entries.length} image{entries.length !== 1 ? 's' : ''} to PDF
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
              <Button
                onClick={() => downloadBytes(resultBytes, `${baseName}.pdf`)}
                size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center"
              >
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
