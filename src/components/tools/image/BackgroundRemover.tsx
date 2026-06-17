import { useState, useCallback } from 'react'
import { Eraser, Download, RotateCcw, CheckCircle2, Info } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import { getToolBySlug } from '../../../data/tools'
import { removeBackground, downloadBlob, formatFileSize } from '../../../lib/image/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile } from '../../../lib/validation'

export default function BackgroundRemover() {
  const tool = getToolBySlug('background-remover')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [file, setFile] = useState<File | null>(null)
  const [origUrl, setOrigUrl] = useState<string | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [progressLabel, setProgressLabel] = useState('Processing…')

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return
    const types = ['image/jpeg','image/jpg','image/png','image/webp']
    if (!validateFile(f, { allowedTypes: types }).valid) return
    if (origUrl) URL.revokeObjectURL(origUrl)
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    setFile(f); setResultBlob(null); setResultUrl(null); setOrigUrl(URL.createObjectURL(f)); reset()
  }, [origUrl, resultUrl, reset])

  const handleRemove = useCallback(async () => {
    if (!file) return
    trackToolUse('background-remover')
    setProgressLabel('Loading AI model (first run ~30s)…')
    await process(async onProgress => {
      onProgress(5)
      const blob = await removeBackground(file, (pct) => {
        onProgress(Math.max(5, pct))
        if (pct < 30) setProgressLabel('Downloading AI model…')
        else if (pct < 60) setProgressLabel('Analysing image…')
        else setProgressLabel('Removing background…')
      })
      if (resultUrl) URL.revokeObjectURL(resultUrl)
      const url = URL.createObjectURL(blob)
      setResultBlob(blob); setResultUrl(url)
      onProgress(100)
    })
  }, [file, process, trackToolUse, resultUrl])

  const outputName = file ? file.name.replace(/\.[^.]+$/, '') + '-no-bg.png' : 'no-background.png'

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'Does this work on all images?', answer: 'Best results with clear subjects on distinct backgrounds. Products, portraits, and objects on solid or simple backgrounds work excellently. Hair and reflective objects may need manual touch-up.' },
      { question: 'Why does the first run take longer?', answer: 'The AI model (~45 MB) downloads once and is cached in your browser. Subsequent images process in 5–15 seconds.' },
      { question: 'Is my image uploaded to any server?', answer: 'No. The AI runs entirely in your browser using WebAssembly. Your images never leave your device.' },
    ]}>
      <div className="p-6 space-y-5">
        <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">AI model runs in your browser. First use downloads ~45 MB (cached for future sessions). No images are uploaded.</p>
        </div>

        {!file && (
          <DropZone onFiles={handleFile} accept={{ 'image/*': ['.jpg','.jpeg','.png','.webp'] }}
            label="Drop your image here" sublabel="JPG, PNG, WEBP — AI removes background automatically" />
        )}

        {file && origUrl && (status === 'idle' || status === 'done') && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">Original</p>
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square flex items-center justify-center">
                <img src={origUrl} alt="Original" className="max-w-full max-h-full object-contain" />
              </div>
              <p className="text-xs text-gray-400 mt-1.5 truncate">{file.name} · {formatFileSize(file.size)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">Result</p>
              <div className="rounded-xl overflow-hidden border border-gray-200 aspect-square flex items-center justify-center"
                style={{ backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, white 0% 50%) 0 0 / 12px 12px' }}>
                {resultUrl
                  ? <img src={resultUrl} alt="Background removed" className="max-w-full max-h-full object-contain" />
                  : <p className="text-xs text-gray-400 text-center px-4">Background removed<br />result appears here</p>
                }
              </div>
              {resultBlob && <p className="text-xs text-gray-400 mt-1.5">{formatFileSize(resultBlob.size)} PNG (with transparency)</p>}
            </div>
          </div>
        )}

        {file && status === 'idle' && (
          <div className="flex gap-3">
            <Button onClick={handleRemove} className="flex-1 justify-center" size="lg" icon={<Eraser className="w-4 h-4" />}>
              {resultBlob ? 'Remove again' : 'Remove Background'}
            </Button>
            {resultBlob && (
              <Button onClick={() => downloadBlob(resultBlob!, outputName)} variant="secondary" size="lg" icon={<Download className="w-4 h-4" />}>
                Download PNG
              </Button>
            )}
            <button onClick={() => { setFile(null); if (origUrl) URL.revokeObjectURL(origUrl); if (resultUrl) URL.revokeObjectURL(resultUrl); reset() }}
              className="px-3 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ✕
            </button>
          </div>
        )}

        {status === 'processing' && (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm font-semibold text-gray-700">{progressLabel}</p>
            <ProgressBar value={progress} className="max-w-xs mx-auto" />
            <p className="text-xs text-gray-400">Processing locally — no upload</p>
          </div>
        )}

        {status === 'done' && resultBlob && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-800">Background removed</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => downloadBlob(resultBlob!, outputName)} size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                Download transparent PNG
              </Button>
              <Button variant="secondary" size="lg" icon={<RotateCcw className="w-4 h-4" />}
                onClick={() => { setFile(null); setResultBlob(null); if (origUrl) URL.revokeObjectURL(origUrl); if (resultUrl) URL.revokeObjectURL(resultUrl); reset() }}>
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
