import { useState, useCallback } from 'react'
import { Zap, Download, RotateCcw, CheckCircle2 } from 'lucide-react'
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

type OutFmt = 'webp' | 'jpeg' | 'png'
interface Result { file: File; blob: Blob; url: string; ext: string }

const ACCEPT_ALL = { 'image/*': ['.jpg','.jpeg','.png','.webp','.gif','.bmp'] }

export default function WEBPConverter() {
  const tool = getToolBySlug('webp-converter')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [files, setFiles] = useState<File[]>([])
  const [outFmt, setOutFmt] = useState<OutFmt>('webp')
  const [quality, setQuality] = useState(85)
  const [results, setResults] = useState<Result[]>([])

  const handleFiles = useCallback((newFiles: File[]) => {
    const types = ['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/bmp']
    const valid = newFiles.filter(f => validateFile(f, { allowedTypes: types }).valid)
    setFiles(prev => [...prev, ...valid]); setResults([]); reset()
  }, [reset])

  const handleConvert = useCallback(async () => {
    if (!files.length) return
    trackToolUse('webp-converter')
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
    if (results.length === 1) { downloadBlob(results[0].blob, getOutputFilename(results[0].file.name, '', results[0].ext)); return }
    await downloadAsZip(results.map(r => ({ name: getOutputFilename(r.file.name,'',r.ext), data: r.blob })), `converted-${outFmt}.zip`)
  }

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'How much smaller is WEBP than JPG?', answer: 'On average 25–34% smaller than JPEG at equivalent visual quality. For photographic content this means meaningful bandwidth savings.' },
      { question: 'Why convert WEBP to JPG or PNG?', answer: 'WEBP is not universally supported in email clients, some design tools, and older systems. Convert to JPG/PNG for maximum compatibility.' },
      { question: 'Does WEBP support transparency?', answer: 'Yes. WEBP supports both lossy (no transparency) and lossless (with transparency) modes. Converting a PNG with transparency to WEBP preserves the alpha channel.' },
    ]}>
      <div className="p-6 space-y-5">
        <DropZone onFiles={handleFiles} accept={ACCEPT_ALL} multiple
          label="Drop images here" sublabel="JPG, PNG, WEBP, GIF, BMP — convert to any format" />

        {files.length > 0 && (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <Select label="Convert to"
                options={[
                  { value: 'webp', label: 'WEBP (recommended for web)' },
                  { value: 'jpeg', label: 'JPG (universal, no transparency)' },
                  { value: 'png', label: 'PNG (lossless, with transparency)' },
                ]}
                value={outFmt} onChange={e => { setOutFmt(e.target.value as OutFmt); setResults([]); reset() }} />
              {outFmt !== 'png' && (
                <Slider label="Quality" min={50} max={100} value={quality}
                  displayValue={`${quality}%`} onChange={v => { setQuality(v); setResults([]); reset() }} />
              )}
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                  <Zap className="w-4 h-4 text-primary-500 shrink-0" />
                  <p className="text-xs text-gray-700 flex-1 truncate">{f.name}</p>
                  <span className="text-xs text-gray-400">{formatFileSize(f.size)}</span>
                  <button onClick={() => setFiles(p => p.filter((_,j) => j !== i))} className="text-gray-300 hover:text-red-500 text-xs">✕</button>
                </div>
              ))}
            </div>

            {status === 'idle' && (
              <Button onClick={handleConvert} className="w-full justify-center" size="lg" icon={<Zap className="w-4 h-4" />}>
                Convert {files.length} image{files.length !== 1 ? 's' : ''} to {outFmt.toUpperCase()}
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
              <p className="text-sm font-semibold text-emerald-800">{results.length} {outFmt.toUpperCase()} file{results.length !== 1 ? 's' : ''} ready</p>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                  <img src={r.url} alt="" className="w-6 h-6 object-cover rounded shrink-0" />
                  <p className="text-xs text-gray-700 flex-1 truncate">{getOutputFilename(r.file.name,'',r.ext)}</p>
                  <span className="text-xs text-gray-400">{formatFileSize(r.blob.size)}</span>
                  {r.blob.size < r.file.size && <span className="text-xs font-semibold text-emerald-600">-{getSavingsPercent(r.file.size, r.blob.size)}%</span>}
                  <button onClick={() => downloadBlob(r.blob, getOutputFilename(r.file.name,'',r.ext))} className="text-primary-600 hover:text-primary-700">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button onClick={downloadAll} size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                {results.length > 1 ? 'Download all as ZIP' : `Download ${outFmt.toUpperCase()}`}
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
