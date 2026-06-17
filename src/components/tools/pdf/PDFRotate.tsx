import { useState, useCallback } from 'react'
import { RotateCw, Download, RotateCcw as Reset, CheckCircle2 } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import { getToolBySlug } from '../../../data/tools'
import { rotatePDF, downloadBytes, formatFileSize, getPageCount } from '../../../lib/pdf/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile, ACCEPT } from '../../../lib/validation'

type Deg = 90 | 180 | 270
type Scope = 'all' | 'custom'

export default function PDFRotate() {
  const tool = getToolBySlug('pdf-rotate')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [rotation, setRotation] = useState<Deg>(90)
  const [scope, setScope] = useState<Scope>('all')
  const [pageInput, setPageInput] = useState('')
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null)

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0]
    if (!f) return
    const v = validateFile(f, { allowedTypes: ['application/pdf'] })
    if (!v.valid) return
    setFile(f); setResultBytes(null); reset()
    try { setPageCount(await getPageCount(f)) } catch { setPageCount(0) }
  }, [reset])

  /** Parse "1,3,5-8" → [0,2,4,5,6,7] (0-indexed) */
  function parsePageIndices(input: string, total: number): number[] {
    const indices = new Set<number>()
    input.split(',').forEach(part => {
      const rangeParts = part.trim().split('-')
      if (rangeParts.length === 2) {
        const start = parseInt(rangeParts[0], 10)
        const end = parseInt(rangeParts[1], 10)
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= total) indices.add(i - 1)
        }
      } else {
        const n = parseInt(part.trim(), 10)
        if (n >= 1 && n <= total) indices.add(n - 1)
      }
    })
    return Array.from(indices).sort((a, b) => a - b)
  }

  const handleRotate = useCallback(async () => {
    if (!file) return
    trackToolUse('pdf-rotate')
    await process(async onProgress => {
      onProgress(20)
      const indices = scope === 'custom' && pageInput.trim()
        ? parsePageIndices(pageInput, pageCount)
        : undefined
      const bytes = await rotatePDF(file, rotation, indices)
      onProgress(90)
      setResultBytes(bytes)
      onProgress(100)
    })
  }, [file, rotation, scope, pageInput, pageCount, process, trackToolUse])

  const DEG_OPTS: { value: Deg; label: string; icon: string }[] = [
    { value: 90, label: '90° Clockwise', icon: '↻' },
    { value: 180, label: '180° (Flip)', icon: '↕' },
    { value: 270, label: '90° Counter-CW', icon: '↺' },
  ]

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'Can I rotate specific pages only?', answer: 'Yes. Select "Specific pages" and enter page numbers like "1,3,5-8" to rotate only those pages.' },
      { question: 'Does rotation affect PDF quality?', answer: 'No. Rotation is a metadata change — no re-rendering occurs, quality is unchanged.' },
      { question: 'Can I undo a rotation?', answer: 'Apply the opposite rotation (e.g., 270° to undo 90°), or rotate 90° three times to undo one 90° rotation.' },
    ]}>
      <div className="p-6 space-y-5">
        {!file && <DropZone onFiles={handleFile} accept={ACCEPT.pdf} label="Drop your PDF here" />}

        {file && status === 'idle' && (
          <>
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
              <RotateCw className="w-4 h-4 text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(file.size)}{pageCount > 0 ? ` · ${pageCount} pages` : ''}</p>
              </div>
              <button onClick={() => { setFile(null); reset() }} className="text-xs text-gray-400 hover:text-gray-600">Remove</button>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Rotation</p>
              <div className="grid grid-cols-3 gap-2">
                {DEG_OPTS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRotation(opt.value)}
                    className={`flex flex-col items-center gap-1.5 py-3 border rounded-xl transition-colors ${
                      rotation === opt.value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl" aria-hidden>{opt.icon}</span>
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Apply to</p>
              <div className="flex gap-2">
                {(['all', 'custom'] as Scope[]).map(s => (
                  <button key={s} onClick={() => setScope(s)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      scope === s ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {s === 'all' ? 'All pages' : 'Specific pages'}
                  </button>
                ))}
              </div>
              {scope === 'custom' && (
                <input
                  type="text"
                  value={pageInput}
                  onChange={e => setPageInput(e.target.value)}
                  placeholder={`e.g. 1,3,5-8 (of ${pageCount} pages)`}
                  className="mt-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Page numbers to rotate"
                />
              )}
            </div>

            <Button onClick={handleRotate} className="w-full justify-center" size="lg" icon={<RotateCw className="w-4 h-4" />}>
              Rotate PDF
            </Button>
          </>
        )}

        {status === 'processing' && (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm font-semibold text-gray-700">Rotating pages…</p>
            <ProgressBar value={progress} className="max-w-xs mx-auto" />
          </div>
        )}

        {status === 'done' && resultBytes && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-800">Rotation applied — {formatFileSize(resultBytes.length)}</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => downloadBytes(resultBytes, file!.name.replace('.pdf', '-rotated.pdf'))}
                size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center"
              >Download rotated PDF</Button>
              <Button variant="secondary" size="lg" icon={<Reset className="w-4 h-4" />}
                onClick={() => { setFile(null); setResultBytes(null); reset() }}>New file</Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
            <Button variant="secondary" onClick={reset} icon={<Reset className="w-4 h-4" />}>Try again</Button>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
