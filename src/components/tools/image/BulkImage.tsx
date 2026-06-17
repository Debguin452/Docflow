import { useState, useCallback } from 'react'
import { Layers, Download, RotateCcw, CheckCircle2 } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import Slider from '../../ui/Slider'
import Select from '../../ui/Select'
import Input from '../../ui/Input'
import { getToolBySlug } from '../../../data/tools'
import { compressImage, resizeImage, convertImageFormat, downloadBlob, getOutputFilename, formatFileSize, getSavingsPercent } from '../../../lib/image/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile } from '../../../lib/validation'
import { downloadAsZip } from '../../../lib/zip'
import type { ImageFormat } from '../../../lib/image/operations'

type Operation = 'compress' | 'resize' | 'convert'
interface Result { file: File; blob: Blob; url: string; name: string }

export default function BulkImage() {
  const tool = getToolBySlug('bulk-image')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [files, setFiles] = useState<File[]>([])
  const [op, setOp] = useState<Operation>('compress')
  const [quality, setQuality] = useState(80)
  const [resizeW, setResizeW] = useState('1920')
  const [resizeH, setResizeH] = useState('')
  const [toFmt, setToFmt] = useState<ImageFormat>('webp')
  const [results, setResults] = useState<Result[]>([])

  const handleFiles = useCallback((newFiles: File[]) => {
    const types = ['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/bmp']
    const valid = newFiles.filter(f => validateFile(f, { allowedTypes: types }).valid)
    setFiles(prev => [...prev, ...valid]); setResults([]); reset()
  }, [reset])

  const handleProcess = useCallback(async () => {
    if (!files.length) return
    trackToolUse('bulk-image')
    await process(async onProgress => {
      const out: Result[] = []
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        let blob: Blob
        let ext = f.name.split('.').pop() ?? 'jpg'

        if (op === 'compress') {
          const compressed = await compressImage(f, { quality: quality / 100 })
          blob = compressed as unknown as Blob
        } else if (op === 'resize') {
          const w = resizeW ? parseInt(resizeW, 10) : undefined
          const h = resizeH ? parseInt(resizeH, 10) : undefined
          blob = await resizeImage(f, { width: w, height: h, maintainAspectRatio: true, quality: quality / 100 })
        } else {
          ext = toFmt === 'jpeg' ? 'jpg' : toFmt
          blob = await convertImageFormat(f, toFmt, quality / 100)
        }

        const name = getOutputFilename(f.name, op === 'compress' ? '-compressed' : op === 'resize' ? '-resized' : '', ext)
        out.push({ file: f, blob, url: URL.createObjectURL(blob), name })
        onProgress(Math.round(((i + 1) / files.length) * 95))
      }
      setResults(out); onProgress(100)
    })
  }, [files, op, quality, resizeW, resizeH, toFmt, process, trackToolUse])

  const downloadAll = async () => {
    if (results.length === 1) { downloadBlob(results[0].blob, results[0].name); return }
    await downloadAsZip(results.map(r => ({ name: r.name, data: r.blob })), 'bulk-processed.zip')
  }

  const totalOriginal = files.reduce((s, f) => s + f.size, 0)
  const totalResult = results.reduce((s, r) => s + r.blob.size, 0)

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'How many images can I process at once?', answer: 'No hard limit. For very large batches (100+ images or very large files), processing may take a few minutes but will complete without errors.' },
      { question: 'Can I mix different operations in one batch?', answer: 'Each batch applies one operation to all files. For different operations, process in separate batches.' },
      { question: 'Are the results downloaded one by one or as a ZIP?', answer: 'Multiple files are automatically bundled into a ZIP file. Single-file results download directly.' },
    ]}>
      <div className="p-6 space-y-5">
        <DropZone onFiles={handleFiles} accept={{ 'image/*': ['.jpg','.jpeg','.png','.webp','.gif','.bmp'] }}
          multiple label="Drop images here" sublabel="Process dozens of images with one operation in seconds" />

        {files.length > 0 && (
          <>
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">{files.length} images · {formatFileSize(totalOriginal)}</p>
              <button onClick={() => { setFiles([]); setResults([]); reset() }} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Clear all</button>
            </div>

            {/* Operation selector */}
            <div className="grid grid-cols-3 gap-2">
              {([['compress','Compress'],['resize','Resize'],['convert','Convert']] as [Operation, string][]).map(([v, label]) => (
                <button key={v} onClick={() => { setOp(v); setResults([]); reset() }}
                  className={`py-2.5 text-sm font-medium rounded-lg border transition-colors ${op === v ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Settings per operation */}
            {op === 'compress' && (
              <Slider label="Quality" min={10} max={100} value={quality} displayValue={`${quality}%`} onChange={setQuality} />
            )}
            {op === 'resize' && (
              <div className="grid sm:grid-cols-2 gap-3">
                <Input label="Max width (px)" type="number" min="1" value={resizeW}
                  onChange={e => setResizeW(e.target.value)} placeholder="e.g. 1920" hint="Leave blank to keep original" />
                <Input label="Max height (px)" type="number" min="1" value={resizeH}
                  onChange={e => setResizeH(e.target.value)} placeholder="e.g. 1080 (optional)" />
              </div>
            )}
            {op === 'convert' && (
              <Select label="Convert to"
                options={[
                  { value: 'webp', label: 'WEBP (smallest for web)' },
                  { value: 'jpeg', label: 'JPG (universal)' },
                  { value: 'png',  label: 'PNG (lossless)' },
                ]}
                value={toFmt} onChange={e => { setToFmt(e.target.value as ImageFormat); setResults([]); reset() }} />
            )}

            {status === 'idle' && (
              <Button onClick={handleProcess} className="w-full justify-center" size="lg" icon={<Layers className="w-4 h-4" />}>
                {op.charAt(0).toUpperCase() + op.slice(1)} {files.length} Images
              </Button>
            )}
          </>
        )}

        {status === 'processing' && (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm font-semibold text-gray-700">Processing {files.length} images…</p>
            <ProgressBar value={progress} label={`${Math.round(progress * files.length / 100)} / ${files.length} done`} className="max-w-xs mx-auto" />
          </div>
        )}

        {status === 'done' && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">{results.length} images processed</p>
                  {totalResult < totalOriginal && (
                    <p className="text-xs text-emerald-600">{formatFileSize(totalOriginal)} → {formatFileSize(totalResult)} (-{getSavingsPercent(totalOriginal, totalResult)}%)</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={downloadAll} size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                {results.length > 1 ? `Download all (${results.length}) as ZIP` : 'Download'}
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
