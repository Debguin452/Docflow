import { useState, useCallback } from 'react'
import { BookOpen, Download, RotateCcw, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import Input from '../../ui/Input'
import { getToolBySlug } from '../../../data/tools'
import { extractPages, downloadBytes, getPageCount, formatFileSize } from '../../../lib/pdf/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile, ACCEPT } from '../../../lib/validation'

interface Range { id: string; from: string; to: string }

function makeRange(): Range { return { id: crypto.randomUUID(), from: '', to: '' } }

function parseToIndices(ranges: Range[], total: number): number[] {
  const set = new Set<number>()
  ranges.forEach(r => {
    const from = parseInt(r.from, 10)
    const to = r.to.trim() ? parseInt(r.to, 10) : from
    if (isNaN(from) || from < 1) return
    const end = Math.min(isNaN(to) ? from : to, total)
    for (let i = from; i <= end; i++) set.add(i - 1)
  })
  return Array.from(set).sort((a, b) => a - b)
}

export default function PDFExtract() {
  const tool = getToolBySlug('pdf-extract')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [ranges, setRanges] = useState<Range[]>([makeRange()])
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null)

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0]; if (!f) return
    if (!validateFile(f, { allowedTypes: ['application/pdf'] }).valid) return
    setFile(f); setResultBytes(null); reset()
    try {
      const count = await getPageCount(f)
      setPageCount(count)
      setRanges([{ id: crypto.randomUUID(), from: '1', to: String(count) }])
    } catch { setPageCount(0) }
  }, [reset])

  const handleExtract = useCallback(async () => {
    if (!file) return
    const indices = parseToIndices(ranges, pageCount)
    if (indices.length === 0) return
    trackToolUse('pdf-extract')
    await process(async onProgress => {
      onProgress(20)
      const bytes = await extractPages(file, indices)
      onProgress(90)
      setResultBytes(bytes)
      onProgress(100)
    })
  }, [file, ranges, pageCount, process, trackToolUse])

  const previewIndices = parseToIndices(ranges, pageCount)

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'What is the difference between Extract and Split?', answer: 'Extract lets you define exactly which pages go into a single new PDF. Split creates multiple separate PDFs from one source.' },
      { question: 'Can I extract non-consecutive pages?', answer: 'Yes. Add multiple ranges (e.g., pages 1–3 and pages 8–10) to extract non-consecutive sections.' },
      { question: 'Does extraction preserve hyperlinks and annotations?', answer: 'Yes. Pages are copied as-is from the source PDF, preserving all embedded content.' },
    ]}>
      <div className="p-6 space-y-5">
        {!file && <DropZone onFiles={handleFile} accept={ACCEPT.pdf} label="Drop your PDF here" />}

        {file && status === 'idle' && (
          <>
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
              <BookOpen className="w-4 h-4 text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(file.size)}{pageCount > 0 && ` · ${pageCount} pages`}</p>
              </div>
              <button onClick={() => { setFile(null); reset() }} className="text-xs text-gray-400 hover:text-gray-600">Remove</button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Page ranges to extract</p>
              {ranges.map((r, i) => (
                <div key={r.id} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                  <Input type="number" min="1" max={pageCount || undefined}
                    placeholder="From" value={r.from}
                    onChange={e => setRanges(prev => prev.map(x => x.id === r.id ? { ...x, from: e.target.value } : x))}
                    className="w-24" />
                  <span className="text-sm text-gray-400">to</span>
                  <Input type="number" min="1" max={pageCount || undefined}
                    placeholder="To (optional)" value={r.to}
                    onChange={e => setRanges(prev => prev.map(x => x.id === r.id ? { ...x, to: e.target.value } : x))}
                    className="w-28" />
                  {ranges.length > 1 && (
                    <button onClick={() => setRanges(prev => prev.filter(x => x.id !== r.id))}
                      className="text-gray-300 hover:text-red-500 transition-colors" aria-label="Remove range">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => setRanges(r => [...r, makeRange()])}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-1">
                <Plus className="w-3.5 h-3.5" /> Add range
              </button>
            </div>

            {previewIndices.length > 0 && (
              <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-2.5">
                Will extract <strong>{previewIndices.length} page{previewIndices.length !== 1 ? 's' : ''}</strong>:{' '}
                {previewIndices.slice(0, 20).map(i => i + 1).join(', ')}{previewIndices.length > 20 ? '…' : ''}
              </p>
            )}

            <Button onClick={handleExtract} className="w-full justify-center" size="lg"
              icon={<BookOpen className="w-4 h-4" />} disabled={previewIndices.length === 0}>
              Extract {previewIndices.length > 0 ? previewIndices.length : ''} Page{previewIndices.length !== 1 ? 's' : ''}
            </Button>
          </>
        )}

        {status === 'processing' && (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm font-semibold text-gray-700">Extracting pages…</p>
            <ProgressBar value={progress} className="max-w-xs mx-auto" />
          </div>
        )}

        {status === 'done' && resultBytes && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-800">
                Extracted {previewIndices.length} page{previewIndices.length !== 1 ? 's' : ''} — {formatFileSize(resultBytes.length)}
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => downloadBytes(resultBytes!, file!.name.replace('.pdf', '-extracted.pdf'))}
                size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                Download extracted PDF
              </Button>
              <Button variant="secondary" size="lg" icon={<RotateCcw className="w-4 h-4" />}
                onClick={() => { setFile(null); setResultBytes(null); reset() }}>
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
