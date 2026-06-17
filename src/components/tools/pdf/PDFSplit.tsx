import { useState, useCallback } from 'react'
import { Scissors, Download, RotateCcw, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import Input from '../../ui/Input'
import { getToolBySlug } from '../../../data/tools'
import { splitPDF, splitPDFEveryPage, getPageCount, downloadBytes, formatFileSize } from '../../../lib/pdf/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile, ACCEPT } from '../../../lib/validation'

type Mode = 'ranges' | 'every'
interface Range { id: string; start: string; end: string }

function makeRange(): Range { return { id: crypto.randomUUID(), start: '', end: '' } }

export default function PDFSplit() {
  const tool = getToolBySlug('pdf-split')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [mode, setMode] = useState<Mode>('ranges')
  const [ranges, setRanges] = useState<Range[]>([makeRange()])
  const [results, setResults] = useState<Array<{ name: string; bytes: Uint8Array }>>([])

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0]
    if (!f) return
    const v = validateFile(f, { allowedTypes: ['application/pdf'] })
    if (!v.valid) return
    setFile(f); reset(); setResults([])
    try {
      const count = await getPageCount(f)
      setPageCount(count)
      setRanges([{ id: crypto.randomUUID(), start: '1', end: String(count) }])
    } catch { setPageCount(0) }
  }, [reset])

  const addRange = () => setRanges(r => [...r, makeRange()])
  const removeRange = (id: string) => setRanges(r => r.filter(x => x.id !== id))
  const updateRange = (id: string, field: 'start' | 'end', val: string) =>
    setRanges(r => r.map(x => x.id === id ? { ...x, [field]: val } : x))

  const handleSplit = useCallback(async () => {
    if (!file) return
    trackToolUse('split-pdf')
    await process(async onProgress => {
      onProgress(10)
      let parts: Uint8Array[]
      if (mode === 'every') {
        parts = await splitPDFEveryPage(file)
      } else {
        const validRanges = ranges
          .map(r => ({ start: parseInt(r.start, 10), end: parseInt(r.end, 10) }))
          .filter(r => !isNaN(r.start) && !isNaN(r.end) && r.start >= 1 && r.end >= r.start)
        if (validRanges.length === 0) throw new Error('Enter at least one valid page range.')
        parts = await splitPDF(file, validRanges)
      }
      onProgress(90)
      const baseName = file.name.replace(/\.pdf$/i, '')
      setResults(parts.map((bytes, i) => ({
        name: `${baseName}-part-${i + 1}.pdf`,
        bytes,
      })))
      onProgress(100)
    })
  }, [file, mode, ranges, process, trackToolUse])

  const downloadAll = async () => {
    if (results.length === 1) {
      downloadBytes(results[0].bytes, results[0].name); return
    }
    // Zip multiple files
    const { default: JSZipClass } = await import('jszip')
    const zip = new JSZipClass()
    results.forEach(r => zip.file(r.name, r.bytes))
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'split-pages.zip'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'Can I split into specific page ranges?', answer: 'Yes. Define one or more ranges (e.g., 1–5 and 6–10) and each range becomes a separate PDF.' },
      { question: 'Does splitting preserve fonts and images?', answer: 'Yes. Pages are copied exactly from the source — no re-rendering occurs.' },
      { question: 'Can I download all split files at once?', answer: 'If you split into more than one file, a ZIP download button appears to download all parts in one click.' },
    ]}>
      <div className="p-6 space-y-5">
        {!file && (
          <DropZone onFiles={handleFile} accept={ACCEPT.pdf} label="Drop your PDF here" sublabel="We'll show page count and let you define ranges" />
        )}

        {file && status === 'idle' && (
          <>
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
              <Scissors className="w-4 h-4 text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)} · {pageCount > 0 ? `${pageCount} pages` : 'loading…'}</p>
              </div>
              <button onClick={() => { setFile(null); reset() }} className="text-xs text-gray-400 hover:text-gray-600">Remove</button>
            </div>

            {/* Mode selector */}
            <div className="flex gap-2">
              {(['ranges', 'every'] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    mode === m ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {m === 'ranges' ? 'By page range' : 'Every page separately'}
                </button>
              ))}
            </div>

            {mode === 'ranges' && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Page ranges {pageCount > 0 && <span className="text-gray-400 font-normal">(total: {pageCount})</span>}</p>
                {ranges.map((range, i) => (
                  <div key={range.id} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5 text-center">{i + 1}</span>
                    <Input
                      type="number" min="1" max={pageCount || undefined}
                      placeholder="From" value={range.start}
                      onChange={e => updateRange(range.id, 'start', e.target.value)}
                      className="w-24"
                    />
                    <span className="text-gray-400 text-sm">to</span>
                    <Input
                      type="number" min="1" max={pageCount || undefined}
                      placeholder="To" value={range.end}
                      onChange={e => updateRange(range.id, 'end', e.target.value)}
                      className="w-24"
                    />
                    {ranges.length > 1 && (
                      <button onClick={() => removeRange(range.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addRange} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-1">
                  <Plus className="w-3.5 h-3.5" /> Add range
                </button>
              </div>
            )}

            {mode === 'every' && pageCount > 0 && (
              <p className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-3">
                Will create <strong>{pageCount} separate PDF files</strong>, one per page.
              </p>
            )}

            <Button onClick={handleSplit} className="w-full justify-center" size="lg" icon={<Scissors className="w-4 h-4" />}>
              Split PDF
            </Button>
          </>
        )}

        {status === 'processing' && (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm font-semibold text-gray-700">Splitting PDF…</p>
            <ProgressBar value={progress} className="max-w-xs mx-auto" />
          </div>
        )}

        {status === 'done' && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-800">Split into {results.length} PDF file{results.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                  <p className="text-xs text-gray-700 truncate">{r.name}</p>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-xs text-gray-400">{formatFileSize(r.bytes.length)}</span>
                    <button onClick={() => downloadBytes(r.bytes, r.name)} className="text-primary-600 hover:text-primary-700">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button onClick={downloadAll} size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                {results.length > 1 ? 'Download all as ZIP' : 'Download PDF'}
              </Button>
              <Button variant="secondary" size="lg" icon={<RotateCcw className="w-4 h-4" />} onClick={() => { setFile(null); setResults([]); reset() }}>
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
