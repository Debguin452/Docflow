import { useState, useCallback } from 'react'
import { Maximize2, Download, RotateCcw, CheckCircle2 } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import Input from '../../ui/Input'
import Select from '../../ui/Select'
import { getToolBySlug } from '../../../data/tools'
import { resizeImage, getImageDimensions, downloadBlob, getOutputFilename, formatFileSize } from '../../../lib/image/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile } from '../../../lib/validation'

type Mode = 'pixels' | 'percent'

export default function ResizeImage() {
  const tool = getToolBySlug('resize-image')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [file, setFile] = useState<File | null>(null)
  const [origDims, setOrigDims] = useState({ w: 0, h: 0 })
  const [preview, setPreview] = useState<string | null>(null)
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [lockAspect, setLockAspect] = useState(true)
  const [mode, setMode] = useState<Mode>('pixels')
  const [format, setFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg')
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0]; if (!f) return
    if (!validateFile(f, { allowedTypes: ['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/bmp'] }).valid) return
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    setFile(f); setResultBlob(null); setResultUrl(null); reset()
    const [dims, url] = await Promise.all([
      getImageDimensions(f),
      Promise.resolve(URL.createObjectURL(f)),
    ])
    setOrigDims({ w: dims.width, h: dims.height })
    setPreview(url)
    setWidth(String(dims.width))
    setHeight(String(dims.height))
  }, [reset, resultUrl])

  // Lock aspect ratio
  const onWidthChange = (val: string) => {
    setWidth(val)
    if (lockAspect && origDims.w && mode === 'pixels') {
      const ratio = origDims.h / origDims.w
      setHeight(String(Math.round(Number(val) * ratio)))
    }
  }
  const onHeightChange = (val: string) => {
    setHeight(val)
    if (lockAspect && origDims.h && mode === 'pixels') {
      const ratio = origDims.w / origDims.h
      setWidth(String(Math.round(Number(val) * ratio)))
    }
  }

  const computeTargetDims = () => {
    if (mode === 'percent') {
      const pct = Number(width) / 100
      return { w: Math.round(origDims.w * pct), h: Math.round(origDims.h * pct) }
    }
    return { w: Number(width) || origDims.w, h: Number(height) || origDims.h }
  }

  const handleResize = useCallback(async () => {
    if (!file) return
    const { w, h } = computeTargetDims()
    trackToolUse('resize-image')
    await process(async onProgress => {
      onProgress(30)
      const blob = await resizeImage(file, { width: w, height: h, maintainAspectRatio: false, format, quality: 0.92 })
      onProgress(90)
      if (resultUrl) URL.revokeObjectURL(resultUrl)
      const url = URL.createObjectURL(blob)
      setResultBlob(blob); setResultUrl(url)
      onProgress(100)
    })
  }, [file, width, height, mode, format, lockAspect, origDims, process, trackToolUse])

  const { w: targetW, h: targetH } = computeTargetDims()

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'Can I resize without distorting the image?', answer: 'Yes. Enable "Lock aspect ratio" to maintain proportions. Enter either width or height and the other adjusts automatically.' },
      { question: 'What is the maximum output size?', answer: 'No maximum is enforced. However, very large outputs (e.g. 10,000 × 10,000 px) may take several seconds to process.' },
      { question: 'Does resizing up improve quality?', answer: 'No. Upscaling uses interpolation and cannot restore detail that wasn\'t in the original. Downscaling always produces better results.' },
    ]}>
      <div className="p-6 space-y-5">
        {!file && <DropZone onFiles={handleFile} accept={{ 'image/*': ['.jpg','.jpeg','.png','.webp','.gif','.bmp'] }} label="Drop your image here" />}

        {file && status === 'idle' && (
          <>
            {preview && (
              <div className="flex gap-4 items-start">
                <img src={preview} alt="Original" className="w-20 h-20 object-cover rounded-lg border border-gray-200 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{origDims.w} × {origDims.h} px · {formatFileSize(file.size)}</p>
                  <button onClick={() => { if (preview) URL.revokeObjectURL(preview); setFile(null); reset() }}
                    className="mt-1 text-xs text-gray-400 hover:text-gray-600">Remove</button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {(['pixels','percent'] as Mode[]).map(m => (
                <button key={m} onClick={() => { setMode(m); setWidth(m === 'percent' ? '100' : String(origDims.w)); setHeight(m === 'percent' ? '100' : String(origDims.h)) }}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-lg border transition-colors ${mode === m ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {m === 'pixels' ? 'Pixels' : 'Percentage'}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-3">
              <Input label={mode === 'pixels' ? 'Width (px)' : 'Scale (%)'} type="number" min="1"
                value={width} onChange={e => onWidthChange(e.target.value)} className="flex-1" />
              {mode === 'pixels' && (
                <>
                  <button onClick={() => setLockAspect(v => !v)}
                    className={`mb-0.5 px-2 py-2 rounded-lg border text-xs transition-colors ${lockAspect ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-400'}`}
                    title={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}>
                    {lockAspect ? '🔒' : '🔓'}
                  </button>
                  <Input label="Height (px)" type="number" min="1"
                    value={height} onChange={e => onHeightChange(e.target.value)} className="flex-1" />
                </>
              )}
            </div>

            <Select label="Output format"
              options={[
                { value: 'jpeg', label: 'JPG (smaller, no transparency)' },
                { value: 'png', label: 'PNG (lossless, larger)' },
                { value: 'webp', label: 'WEBP (smallest, modern browsers)' },
              ]}
              value={format} onChange={e => setFormat(e.target.value as 'jpeg' | 'png' | 'webp')} />

            {targetW > 0 && targetH > 0 && (
              <p className="text-xs text-gray-500">Output: <strong>{targetW} × {targetH} px</strong></p>
            )}

            <Button onClick={handleResize} className="w-full justify-center" size="lg" icon={<Maximize2 className="w-4 h-4" />}>
              Resize Image
            </Button>
          </>
        )}

        {status === 'processing' && (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm font-semibold text-gray-700">Resizing…</p>
            <ProgressBar value={progress} className="max-w-xs mx-auto" />
          </div>
        )}

        {status === 'done' && resultBlob && resultUrl && (
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              {preview && <img src={preview} alt="Original" className="w-20 h-20 object-cover rounded border border-gray-200 shrink-0 opacity-50" />}
              <img src={resultUrl} alt="Resized" className="w-20 h-20 object-cover rounded border border-primary-200 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm font-semibold text-gray-800">Resized</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">{targetW} × {targetH} px · {formatFileSize(resultBlob.size)}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => downloadBlob(resultBlob!, getOutputFilename(file!.name, '-resized', format === 'jpeg' ? 'jpg' : format))}
                size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                Download resized image
              </Button>
              <Button variant="secondary" size="lg" icon={<RotateCcw className="w-4 h-4" />}
                onClick={() => { if (resultUrl) URL.revokeObjectURL(resultUrl); setFile(null); setResultBlob(null); setResultUrl(null); reset() }}>
                New image
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
