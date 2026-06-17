import { useState, useCallback } from 'react'
import { FileImage, Download, RotateCcw, CheckCircle2 } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import Slider from '../../ui/Slider'
import { getToolBySlug } from '../../../data/tools'
import { convertImageFormat, downloadBlob, getOutputFilename, formatFileSize, getSavingsPercent } from '../../../lib/image/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile } from '../../../lib/validation'
import { downloadAsZip } from '../../../lib/zip'

interface Result { file: File; blob: Blob; url: string }

export default function PNGtoJPG() {
  const tool = getToolBySlug('png-to-jpg')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [files, setFiles] = useState<File[]>([])
  const [quality, setQuality] = useState(90)
  const [results, setResults] = useState<Result[]>([])

  const handleFiles = useCallback((newFiles: File[]) => {
    const valid = newFiles.filter(f => validateFile(f, { allowedTypes: ['image/png'] }).valid)
    setFiles(prev => [...prev, ...valid]); setResults([]); reset()
  }, [reset])

  const handleConvert = useCallback(async () => {
    if (!files.length) return
    trackToolUse('png-to-jpg')
    await process(async onProgress => {
      const out: Result[] = []
      for (let i = 0; i < files.length; i++) {
        const blob = await convertImageFormat(files[i], 'jpeg', quality / 100)
        out.push({ file: files[i], blob, url: URL.createObjectURL(blob) })
        onProgress(Math.round(((i + 1) / files.length) * 95))
      }
      setResults(out); onProgress(100)
    })
  }, [files, quality, process, trackToolUse])

  const downloadAll = async () => {
    if (results.length === 1) { downloadBlob(results[0].blob, getOutputFilename(results[0].file.name, '', 'jpg')); return }
    await downloadAsZip(results.map(r => ({ name: getOutputFilename(r.file.name,'','jpg'), data: r.blob })), 'png-to-jpg.zip')
  }

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'Will my transparent background become white?', answer: 'Yes. JPG does not support transparency. Transparent areas in your PNG will be filled with white when converting to JPG.' },
      { question: 'What quality should I use?', answer: '85–92% is ideal for most images — significantly smaller than PNG with excellent visual quality. Below 70% you may see compression artifacts.' },
      { question: 'How much smaller will JPG be than PNG?', answer: 'For photographic content, JPG at 85% quality is typically 5–10× smaller than the equivalent PNG. For flat graphics with few colors, the savings are smaller.' },
    ]}>
      <div className="p-6 space-y-5">
        <DropZone onFiles={handleFiles} accept={{ 'image/png': ['.png'] }}
          multiple label="Drop PNG files here" sublabel="PNG only — convert to JPG with adjustable quality" />

        {files.length > 0 && (
          <>
            {status === 'idle' && (
              <>
                <Slider label="JPEG quality" min={50} max={100} value={quality}
                  displayValue={`${quality}%`} onChange={v => { setQuality(v); setResults([]); reset() }} />
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                      <FileImage className="w-4 h-4 text-blue-500 shrink-0" />
                      <p className="text-xs text-gray-700 flex-1 truncate">{f.name}</p>
                      <span className="text-xs text-gray-400">{formatFileSize(f.size)}</span>
                      <button onClick={() => setFiles(p => p.filter((_,j) => j !== i))} className="text-gray-300 hover:text-red-500 text-xs">✕</button>
                    </div>
                  ))}
                </div>
                <Button onClick={handleConvert} className="w-full justify-center" size="lg" icon={<FileImage className="w-4 h-4" />}>
                  Convert {files.length} PNG{files.length !== 1 ? 's' : ''} to JPG
                </Button>
              </>
            )}
          </>
        )}

        {status === 'processing' && (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm font-semibold text-gray-700">Converting…</p>
            <ProgressBar value={progress} className="max-w-xs mx-auto" />
          </div>
        )}

        {status === 'done' && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-800">{results.length} JPG file{results.length !== 1 ? 's' : ''} ready</p>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                  <img src={r.url} alt="" className="w-6 h-6 object-cover rounded shrink-0" />
                  <p className="text-xs text-gray-700 flex-1 truncate">{getOutputFilename(r.file.name,'','jpg')}</p>
                  <span className="text-xs text-gray-400">{formatFileSize(r.blob.size)}</span>
                  <span className="text-xs font-semibold text-emerald-600 ml-1">-{getSavingsPercent(r.file.size, r.blob.size)}%</span>
                  <button onClick={() => downloadBlob(r.blob, getOutputFilename(r.file.name,'','jpg'))} className="text-primary-600 hover:text-primary-700 ml-1">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button onClick={downloadAll} size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                {results.length > 1 ? 'Download all as ZIP' : 'Download JPG'}
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
