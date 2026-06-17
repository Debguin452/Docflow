import { useState, useCallback } from 'react'
import { FilePlus2, Download, RotateCcw, CheckCircle2, GripVertical, Trash2 } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import { getToolBySlug } from '../../../data/tools'
import { mergePDFs, downloadBytes, formatFileSize } from '../../../lib/pdf/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile, ACCEPT } from '../../../lib/validation'

interface PDFEntry { file: File; id: string }

export default function PDFMerge() {
  const tool = getToolBySlug('pdf-merge')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [entries, setEntries] = useState<PDFEntry[]>([])
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)

  const addFiles = useCallback((files: File[]) => {
    const valid = files.filter(f => {
      const r = validateFile(f, { allowedTypes: ['application/pdf'] })
      return r.valid
    })
    setEntries(prev => [
      ...prev,
      ...valid.map(f => ({ file: f, id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}` })),
    ])
  }, [])

  const removeEntry = (id: string) => setEntries(prev => prev.filter(e => e.id !== id))
  const moveUp = (idx: number) => {
    if (idx === 0) return
    setEntries(prev => { const a = [...prev]; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; return a })
  }
  const moveDown = (idx: number) => {
    setEntries(prev => {
      if (idx >= prev.length - 1) return prev
      const a = [...prev]; [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]]; return a
    })
  }

  // Drag-to-reorder
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
  const onDragEnd = () => { setDraggingIdx(null); setDragOverIdx(null) }

  const handleMerge = useCallback(async () => {
    if (entries.length < 2) return
    trackToolUse('merge-pdf')
    await process(async onProgress => {
      onProgress(10)
      const bytes = await mergePDFs(entries.map(e => e.file))
      onProgress(95)
      setResultBytes(bytes)
      onProgress(100)
    })
  }, [entries, process, trackToolUse])

  const handleDownload = () => {
    if (resultBytes) downloadBytes(resultBytes, 'merged.pdf')
  }

  const totalSize = entries.reduce((s, e) => s + e.file.size, 0)

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'How many PDFs can I merge at once?', answer: 'You can merge as many PDFs as you need. For best performance, we recommend batches of 20 or fewer large files.' },
      { question: 'Does merging change the quality of my PDFs?', answer: 'No. Merging copies pages exactly as-is from source files. No re-rendering or re-compression occurs.' },
      { question: 'Can I reorder pages before merging?', answer: 'Yes — drag and drop the files in the list to set the order they will appear in the merged PDF.' },
    ]}>
      <div className="p-6 space-y-5">
        <DropZone
          onFiles={addFiles}
          accept={ACCEPT.pdf}
          multiple
          label="Drop PDF files here"
          sublabel="Add multiple PDFs — drag to reorder"
        />

        {entries.length > 0 && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-700">
                  {entries.length} file{entries.length !== 1 ? 's' : ''} · {formatFileSize(totalSize)} total
                </p>
                <button onClick={() => setEntries([])} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                  Clear all
                </button>
              </div>
              {entries.map((entry, idx) => (
                <div
                  key={entry.id}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={e => onDragOver(e, idx)}
                  onDrop={e => onDrop(e, idx)}
                  onDragEnd={onDragEnd}
                  className={`flex items-center gap-3 p-3 rounded-lg border bg-white transition-all ${
                    dragOverIdx === idx ? 'border-primary-400 bg-primary-50' : 'border-gray-200'
                  } ${draggingIdx === idx ? 'opacity-40' : ''}`}
                >
                  <GripVertical className="w-4 h-4 text-gray-300 cursor-grab shrink-0" />
                  <span className="text-xs font-mono text-gray-400 w-5 text-right shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{entry.file.name}</p>
                    <p className="text-xs text-gray-400">{formatFileSize(entry.file.size)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => moveUp(idx)} disabled={idx === 0} className="px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30">↑</button>
                    <button onClick={() => moveDown(idx)} disabled={idx === entries.length - 1} className="px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30">↓</button>
                    <button onClick={() => removeEntry(entry.id)} className="ml-1 text-gray-300 hover:text-red-500 transition-colors" aria-label="Remove">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {status === 'idle' && entries.length >= 2 && (
              <Button onClick={handleMerge} className="w-full justify-center" size="lg" icon={<FilePlus2 className="w-4 h-4" />}>
                Merge {entries.length} PDFs
              </Button>
            )}
            {entries.length < 2 && status === 'idle' && (
              <p className="text-center text-sm text-gray-400">Add at least 2 PDFs to merge</p>
            )}
          </>
        )}

        {status === 'processing' && (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm font-semibold text-gray-700">Merging PDFs…</p>
            <ProgressBar value={progress} className="max-w-xs mx-auto" />
          </div>
        )}

        {status === 'done' && resultBytes && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Merged successfully</p>
                <p className="text-xs text-emerald-600">{entries.length} files → {formatFileSize(resultBytes.length)}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleDownload} size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                Download merged PDF
              </Button>
              <Button variant="secondary" size="lg" icon={<RotateCcw className="w-4 h-4" />} onClick={() => { setEntries([]); setResultBytes(null); reset() }}>
                New merge
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4 space-y-3">
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
            <Button variant="secondary" onClick={() => { setEntries([]); reset() }} icon={<RotateCcw className="w-4 h-4" />}>Try again</Button>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
