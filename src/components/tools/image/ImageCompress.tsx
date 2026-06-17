import { ImageDown, Download, RotateCcw, CheckCircle2 } from 'lucide-react'
import { useState, useCallback } from 'react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import Slider from '../../ui/Slider'
import { getToolBySlug } from '../../../data/tools'
import { compressImage, downloadBlob, getOutputFilename, formatFileSize, getSavingsPercent } from '../../../lib/image/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile } from '../../../lib/validation'

interface ImgResult { file: File; blob: Blob; url: string; savings: number }

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

export default function ImageCompress() {
  const tool = getToolBySlug('compress-image')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [files, setFiles] = useState<File[]>([])
  const [quality, setQuality] = useState(80)
  const [results, setResults] = useState<ImgResult[]>([])

  const addFiles = useCallback((newFiles: File[]) => {
    const valid = newFiles.filter(f => validateFile(f, { allowedTypes: ACCEPTED_TYPES }).valid)
    setFiles(prev => [...prev, ...valid])
    setResults([]); reset()
  }, [reset])

  const handleCompress = useCallback(async () => {
    if (files.length === 0) return
    trackToolUse('compress-image')
    await process(async onProgress => {
      const out: ImgResult[] = []
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        const compressed = await compressImage(f, { quality: quality / 100 })
        const blob = compressed as unknown as Blob
        const url = URL.createObjectURL(blob)
        out.push({ file: f, blob, url, savings: getSavingsPercent(f.size, blob.size) })
        onProgress(Math.round(((i + 1) / files.length) * 95))
      }
      setResults(out)
      onProgress(100)
    })
  }, [files, quality, process, trackToolUse])

  const downloadAll = () => {
    results.forEach((r, i) => {
      setTimeout(() => downloadBlob(r.blob, getOutputFilename(r.file.name, '-compressed')), i * 150)
    })
  }

  const totalOriginal = files.reduce((s, f) => s + f.size, 0)
  const totalCompressed = results.reduce((s, r) => s + r.blob.size, 0)
  const totalSavings = getSavingsPercent(totalOriginal, totalCompressed)

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'What quality setting should I use?', answer: 'For web images 70–80% is ideal — smaller files with invisible quality loss. For print or archives use 90%+.' },
      { question: 'Does compression change my image dimensions?', answer: 'No. Only file size is reduced by optimizing the compression. Width and height stay exactly the same.' },
      { question: 'Can I compress multiple images at once?', answer: 'Yes. Drag and drop multiple images and they will all be compressed in one batch.' },
    ]}>
      <div className="p-6 space-y-5">
        <DropZone
          onFiles={addFiles}
          accept={{ 'image/*': ['.jpg','.jpeg','.png','.webp','.gif'] }}
          multiple
          label="Drop images here"
          sublabel="JPG, PNG, WEBP, GIF — drag multiple for batch compression"
        />

        {files.length > 0 && (
          <>
            <Slider label="Quality" min={10} max={100} value={quality}
              displayValue={`${quality}%`} onChange={v => { setQuality(v); setResults([]); reset() }} />

            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-3 flex items-center justify-between">
              <span>{files.length} image{files.length !== 1 ? 's' : ''} selected · {formatFileSize(totalOriginal)} total</span>
              <button onClick={() => { setFiles([]); setResults([]); reset() }} className="text-gray-400 hover:text-red-500 transition-colors">Clear all</button>
            </div>

            {results.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <img src={r.url} alt="" className="w-8 h-8 object-cover rounded border border-emerald-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{r.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(r.file.size)} → {formatFileSize(r.blob.size)}
                        <span className="ml-1.5 font-semibold text-emerald-600">-{r.savings}%</span>
                      </p>
                    </div>
                    <button onClick={() => downloadBlob(r.blob, getOutputFilename(r.file.name, '-compressed'))}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded transition-colors" aria-label="Download">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {status === 'idle' && (
              <Button onClick={handleCompress} className="w-full justify-center" size="lg"
                icon={<ImageDown className="w-4 h-4" />}>
                Compress {files.length} Image{files.length !== 1 ? 's' : ''}
              </Button>
            )}
          </>
        )}

        {status === 'processing' && (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm font-semibold text-gray-700">Compressing images…</p>
            <ProgressBar value={progress} className="max-w-xs mx-auto" />
          </div>
        )}

        {status === 'done' && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">{results.length} image{results.length !== 1 ? 's' : ''} compressed</p>
                  <p className="text-xs text-emerald-600">{formatFileSize(totalOriginal)} → {formatFileSize(totalCompressed)}</p>
                </div>
              </div>
              {totalSavings > 0 && (
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-700">-{totalSavings}%</div>
                  <div className="text-xs text-emerald-600">saved</div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button onClick={downloadAll} size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                Download {results.length > 1 ? `all ${results.length}` : ''}
              </Button>
              <Button variant="secondary" size="lg" icon={<RotateCcw className="w-4 h-4" />}
                onClick={() => { results.forEach(r => URL.revokeObjectURL(r.url)); setFiles([]); setResults([]); reset() }}>
                New batch
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
