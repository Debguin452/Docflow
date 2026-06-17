import { useState, useCallback } from 'react'
import { FileText, Download, RotateCcw, CheckCircle2 } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import Select from '../../ui/Select'
import Slider from '../../ui/Slider'
import ProgressBar from '../../ui/ProgressBar'
import { getToolBySlug } from '../../../data/tools'
import { textToPDF, downloadBytes, formatFileSize } from '../../../lib/pdf/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'

const PAGE_SIZE_OPTS = [
  { value: 'A4', label: 'A4 (210 × 297 mm)' },
  { value: 'Letter', label: 'US Letter (8.5 × 11 in)' },
  { value: 'A3', label: 'A3 (297 × 420 mm)' },
  { value: 'Legal', label: 'US Legal (8.5 × 14 in)' },
]

import { PageSizes } from 'pdf-lib'
const PAGE_SIZE_MAP: Record<string, [number, number]> = {
  A4: PageSizes.A4 as [number, number],
  Letter: PageSizes.Letter as [number, number],
  A3: PageSizes.A3 as [number, number],
  Legal: PageSizes.Legal as [number, number],
}

export default function TextToPDF() {
  const tool = getToolBySlug('text-to-pdf')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [pageSize, setPageSize] = useState('A4')
  const [fontSize, setFontSize] = useState(12)
  const [margin, setMargin] = useState(50)
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null)

  const charCount = text.length
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  // Rough estimate
  const estPages = text.trim() ? Math.max(1, Math.ceil(wordCount / 350)) : 0

  const handleConvert = useCallback(async () => {
    if (!text.trim()) return
    trackToolUse('text-to-pdf')
    await process(async onProgress => {
      onProgress(20)
      const size = PAGE_SIZE_MAP[pageSize] ?? PageSizes.A4 as [number, number]
      const bytes = await textToPDF(text, { fontSize, margin, title: title.trim() || undefined, pageSize: size })
      onProgress(90)
      setResultBytes(bytes)
      onProgress(100)
    })
  }, [text, title, pageSize, fontSize, margin, process, trackToolUse])

  const outputName = (title.trim() || 'document') + '.pdf'

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'Does this support formatted text (bold, headings)?', answer: 'This tool converts plain text to PDF. For formatted documents with headings and bold text, paste your text and use a word processor to export to PDF instead.' },
      { question: 'What is the maximum document length?', answer: 'No limit. Long documents are automatically paginated based on font size and margin settings.' },
      { question: 'Can I set a title for the PDF?', answer: 'Yes. The title appears in PDF metadata (visible in file properties) but not as a visible header on the pages.' },
    ]}>
      <div className="p-6 space-y-5">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">Text content</label>
            {text && (
              <span className="text-xs text-gray-400 tabular-nums">
                {wordCount} words · {charCount} chars{estPages > 0 ? ` · ~${estPages} page${estPages !== 1 ? 's' : ''}` : ''}
              </span>
            )}
          </div>
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setResultBytes(null); reset() }}
            rows={10}
            placeholder="Paste or type your text here…&#10;&#10;Long documents are automatically paginated."
            className="w-full px-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none font-mono leading-relaxed placeholder:font-sans"
            aria-label="Text to convert to PDF"
          />
        </div>

        <Input label="Document title (optional)" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Meeting Notes" hint="Stored in PDF metadata, not visible on pages" />

        <div className="grid sm:grid-cols-2 gap-4">
          <Select label="Page size" options={PAGE_SIZE_OPTS} value={pageSize}
            onChange={e => { setPageSize(e.target.value); setResultBytes(null); reset() }} />
          <Slider label="Font size" min={8} max={24} value={fontSize} displayValue={`${fontSize}pt`}
            onChange={v => { setFontSize(v); setResultBytes(null); reset() }} />
        </div>

        <Slider label="Page margin" min={20} max={100} value={margin} displayValue={`${margin}pt`}
          onChange={v => { setMargin(v); setResultBytes(null); reset() }} />

        {status === 'idle' && (
          <Button onClick={handleConvert} className="w-full justify-center" size="lg"
            icon={<FileText className="w-4 h-4" />} disabled={!text.trim()}>
            Convert to PDF
          </Button>
        )}

        {status === 'processing' && (
          <div className="py-4 text-center space-y-4">
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
                <p className="text-xs text-emerald-600">{estPages} page{estPages !== 1 ? 's' : ''} · {formatFileSize(resultBytes.length)}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => downloadBytes(resultBytes!, outputName)}
                size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                Download PDF
              </Button>
              <Button variant="secondary" size="lg" icon={<RotateCcw className="w-4 h-4" />}
                onClick={() => { setResultBytes(null); reset() }}>
                Edit text
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
