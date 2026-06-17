import { useState, useCallback } from 'react'
import { Stamp, Download, RotateCcw, CheckCircle2 } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import Input from '../../ui/Input'
import Slider from '../../ui/Slider'
import { getToolBySlug } from '../../../data/tools'
import { addTextWatermark, downloadBytes, formatFileSize } from '../../../lib/pdf/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile, ACCEPT } from '../../../lib/validation'

export default function PDFWatermark() {
  const tool = getToolBySlug('pdf-watermark')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('CONFIDENTIAL')
  const [opacity, setOpacity] = useState(15)
  const [fontSize, setFontSize] = useState(60)
  const [rotation, setRotation] = useState(-45)
  const [colorPreset, setColorPreset] = useState<'gray' | 'red' | 'blue' | 'black'>('gray')
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null)

  const COLOR_MAP = {
    gray:  [0.5, 0.5, 0.5] as [number, number, number],
    red:   [0.8, 0.1, 0.1] as [number, number, number],
    blue:  [0.1, 0.3, 0.8] as [number, number, number],
    black: [0.0, 0.0, 0.0] as [number, number, number],
  }

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return
    if (!validateFile(f, { allowedTypes: ['application/pdf'] }).valid) return
    setFile(f); setResultBytes(null); reset()
  }, [reset])

  const handleWatermark = useCallback(async () => {
    if (!file || !text.trim()) return
    trackToolUse('pdf-watermark')
    await process(async onProgress => {
      onProgress(20)
      const bytes = await addTextWatermark(file, text.trim(), {
        opacity: opacity / 100,
        fontSize,
        color: COLOR_MAP[colorPreset],
        rotation,
      })
      onProgress(90)
      setResultBytes(bytes)
      onProgress(100)
    })
  }, [file, text, opacity, fontSize, rotation, colorPreset, process, trackToolUse])

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'Can I add an image watermark?', answer: 'Currently text watermarks are supported. Image watermarks are on the roadmap.' },
      { question: 'Can I remove an existing watermark?', answer: 'Removing watermarks from PDFs created by other tools is not possible without the original document, as watermarks are baked into page content.' },
      { question: 'Will the watermark appear on every page?', answer: 'Yes. The watermark is added to all pages in the PDF.' },
    ]}>
      <div className="p-6 space-y-5">
        {!file && <DropZone onFiles={handleFile} accept={ACCEPT.pdf} label="Drop your PDF here" />}

        {file && status === 'idle' && (
          <>
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
              <Stamp className="w-4 h-4 text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
              </div>
              <button onClick={() => { setFile(null); reset() }} className="text-xs text-gray-400 hover:text-gray-600">Remove</button>
            </div>

            <Input label="Watermark text" value={text} onChange={e => setText(e.target.value)}
              placeholder="e.g. CONFIDENTIAL, DRAFT, © 2024 Company" />

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Color</p>
                <div className="flex gap-2">
                  {(['gray','red','blue','black'] as const).map(c => (
                    <button key={c} onClick={() => setColorPreset(c)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium capitalize transition-colors ${
                        colorPreset === c ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <Slider label="Rotation" min={-90} max={90} step={5} value={rotation} onChange={setRotation}
                displayValue={`${rotation}°`} />
            </div>

            <Slider label="Opacity" min={5} max={60} value={opacity}
              displayValue={`${opacity}%`} onChange={setOpacity} />
            <Slider label="Font size" min={20} max={120} value={fontSize}
              displayValue={`${fontSize}pt`} onChange={setFontSize} />

            {/* Live preview tile */}
            <div className="h-24 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <p style={{
                  fontSize: Math.min(fontSize * 0.4, 40),
                  opacity: opacity / 100,
                  transform: `rotate(${rotation}deg)`,
                  color: `rgb(${COLOR_MAP[colorPreset].map(v => Math.round(v * 255)).join(',')})`,
                  fontWeight: 'bold',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}>
                  {text || 'Watermark preview'}
                </p>
              </div>
              <span className="absolute top-2 right-3 text-[10px] text-gray-300 select-none">Preview</span>
            </div>

            <Button onClick={handleWatermark} className="w-full justify-center" size="lg"
              icon={<Stamp className="w-4 h-4" />} disabled={!text.trim()}>
              Add Watermark
            </Button>
          </>
        )}

        {status === 'processing' && (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm font-semibold text-gray-700">Adding watermark…</p>
            <ProgressBar value={progress} className="max-w-xs mx-auto" />
          </div>
        )}

        {status === 'done' && resultBytes && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-800">Watermark added — {formatFileSize(resultBytes.length)}</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => downloadBytes(resultBytes!, file!.name.replace('.pdf', '-watermarked.pdf'))}
                size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                Download PDF
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
