import { useState, useCallback } from 'react'
import { RefreshCw, Download, RotateCcw, CheckCircle2 } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import Slider from '../../ui/Slider'
import Select from '../../ui/Select'
import { getToolBySlug } from '../../../data/tools'
import { convertImageFormat, downloadBlob, getOutputFilename, formatFileSize, getSavingsPercent } from '../../../lib/image/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile } from '../../../lib/validation'
import { downloadAsZip } from '../../../lib/zip'
import type { ImageFormat } from '../../../lib/image/operations'

interface Result { file: File; blob: Blob; url: string; ext: string }

const FORMAT_OPTS = [
  { value: 'jpeg', label: 'JPG — best for photos, universal compatibility' },
  { value: 'png',  label: 'PNG — lossless, supports transparency' },
  { value: 'webp', label: 'WEBP — smallest size, modern browsers' },
  { value: 'bmp',  label: 'BMP — uncompressed bitmap' },
]

export default function ImageConverter() {
  const tool = getToolBySlug('image-converter')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [files, setFiles] = useState<File[]>([])
  const [outFmt, setOutFmt] = useState<ImageFormat>('webp')
  const [quality, setQuality] = useState(88)
  const [results, setResults] = useState<Result[]>([])

  const handleFiles = useCallback((newFiles: File[]) => {
    const types = ['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/bmp']
    const valid = newFiles.filter(f => validateFile(f, { allowedTypes: types }).valid)
    setFiles(prev => [...prev, ...valid]); setResults([]); reset()
  }, [reset])

  const handleConvert = useCallback(async () => {
    if (!files.length) return
    trackToolUse('image-converter')
    await process(async onProgress => {
      const out: Result[] = []
      const ext = outFmt === 'jpeg' ? 'jpg' : outFmt
      for (let i = 0; i < files.length; i++) {
        const blob = await convertImageFormat(files[i], outFmt, quality / 100)
        out.push({ file: files[i], blob, url: URL.createObjectURL(blob), ext })
        onProgress(Math.round(((i + 1) / files.length) * 95))
      }
      setResults(out); onProgress(100)
    })
  }, [files, outFmt, quality, process, trackToolUse])

  const downloadAll = async () => {
    if (results.length === 1) { downloadBlob(results[0].blob, getOutputFilename(results[0].file.name,'',results[0].ext)); return }
    await downloadAsZip(results.map(r => ({ name: getOutputFilename(r.file.name,'',r.ext), data: r.blob })), `converted-images.zip`)
  }

  const needsQuality = outFmt !== 'png' && outFmt !== 'bmp'

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'Can I convert GIF to other formats?', answer: 'Yes. Note that GIF animation is not preserved — only the first frame will be converted. For animated images, keep the GIF format.' },
      { question: 'Which format should I choose?', answer: 'WEBP for web use (smallest). JPG for photos shared universally. PNG for graphics needing transparency or lossless quality. BMP for legacy software compatibility.' },
      { question: 'Is there a limit to how many images I can convert?', answer: 'No hard limit. Batch convert as many images as needed. Processing is parallel and usually very fast.' },
    ]}>
      <div className="p-6 space-y-5">
        <DropZone onFiles={handleFiles} accept={{ 'image/*': ['.jpg','.jpeg','.png','.webp','.gif','.bmp'] }}
          multiple label="Drop images here" sublabel="Any image format — convert to JPG, PNG, WEBP, or BMP" />

        {files.length > 0 && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <Select label="Output format" options={FORMAT_OPTS} value={outFmt}
                onChange={e => { setOutFmt(e.target.value as ImageFormat); setResults([]); reset() }} />
              {needsQuality && (
                <Slider label="Quality" min={50} max={100} value={quality}
                  displayValue={`${quality}%`} onChange={v => { setQuality(v); setResults([]); reset() }} />
              )}
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                  <RefreshCw className="w-4 h-4 text-primary-400 shrink-0" />
                  <p className="text-xs text-gray-700 flex-1 truncate">{f.name}</p>
                  <span className="text-xs text-gray-400">{formatFileSize(f.size)}</span>
                  <button onClick={() => setFiles(p => p.filter((_,j) => j !== i))} className="text-gray-300 hover:text-red-500 text-xs">✕</button>
                </div>
              ))}
            </div>

            {status === 'idle' && (
              <Button onClick={handleConvert} className="w-full justify-center" size="lg" icon={<RefreshCw className="w-4 h-4" />}>
                Convert {files.length} image{files.length !== 1 ? 's' : ''} to {outFmt === 'jpeg' ? 'JPG' : outFmt.toUpperCase()}
              </Button>
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
              <p className="text-sm font-semibold text-emerald-800">{results.length} file{results.length !== 1 ? 's' : ''} converted</p>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                  <img src={r.url} alt="" className="w-7 h-7 object-cover rounded shrink-0" />
                  <p className="text-xs text-gray-700 flex-1 truncate">{getOutputFilename(r.file.name,'',r.ext)}</p>
                  <span className="text-xs text-gray-400">{formatFileSize(r.blob.size)}</span>
                  {r.blob.size < r.file.size && <span className="text-xs font-semibold text-emerald-600">-{getSavingsPercent(r.file.size,r.blob.size)}%</span>}
                  <button onClick={() => downloadBlob(r.blob, getOutputFilename(r.file.name,'',r.ext))} className="text-primary-600 hover:text-primary-700">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button onClick={downloadAll} size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                {results.length > 1 ? 'Download all as ZIP' : 'Download'}
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
