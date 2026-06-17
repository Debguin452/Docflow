import { useState, useCallback } from 'react'
import { FileDown, Download, RotateCcw, CheckCircle2 } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import { getToolBySlug } from '../../../data/tools'
import { PDF_COMPRESS_FAQ } from '../../../data/faq'
import { compressPDF, downloadBytes, formatFileSize } from '../../../lib/pdf/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'

const LEVELS = [
  { id: 'low', label: 'Low compression', desc: 'Best quality, moderate size reduction', reduction: '~30%' },
  { id: 'medium', label: 'Balanced', desc: 'Good balance of quality and size', reduction: '~60%' },
  { id: 'high', label: 'Maximum compression', desc: 'Smallest file, may reduce quality slightly', reduction: '~85%' },
] as const

type Level = 'low' | 'medium' | 'high'

export default function PDFCompress() {
  const tool = getToolBySlug('pdf-compress')!
  const { status, progress, error, reset, process } = useFileProcess()
  const [file, setFile] = useState<File | null>(null)
  const [level, setLevel] = useState<Level>('medium')
  const [result, setResult] = useState<{ bytes: Uint8Array; name: string; original: number; compressed: number } | null>(null)

  const handleFiles = useCallback((files: File[]) => {
    if (files[0]) { setFile(files[0]); setResult(null); reset() }
  }, [reset])

  const handleCompress = useCallback(async () => {
    if (!file) return
    await process(async (onProgress) => {
      onProgress(20)
      const bytes = await compressPDF(file, level)
      onProgress(90)
      setResult({
        bytes,
        name: file.name.replace('.pdf', '-compressed.pdf'),
        original: file.size,
        compressed: bytes.length,
      })
      onProgress(100)
    })
  }, [file, level, process])

  const handleDownload = () => {
    if (result) downloadBytes(result.bytes, result.name)
  }

  const savings = result ? Math.round(((result.original - result.compressed) / result.original) * 100) : 0

  return (
    <ToolLayout tool={tool} faqs={PDF_COMPRESS_FAQ}>
      <div className="p-6">
        {/* Upload */}
        {!file && (
          <DropZone
            onFiles={handleFiles}
            accept={{ 'application/pdf': ['.pdf'] }}
            label="Drop your PDF here"
            sublabel="or click to browse — max 50MB"
          />
        )}

        {/* File selected */}
        {file && status === 'idle' && (
          <div className="space-y-6">
            {/* File info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
              <div className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-600 rounded-lg shrink-0">
                <FileDown className="w-4.5 h-4.5 w-[18px] h-[18px]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button onClick={() => { setFile(null); reset() }} className="text-xs text-gray-400 hover:text-gray-600">
                Remove
              </button>
            </div>

            {/* Level selector */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Compression level</p>
              <div className="space-y-2">
                {LEVELS.map(l => (
                  <label
                    key={l.id}
                    className={`flex items-center gap-4 p-3.5 border rounded-xl cursor-pointer transition-all ${
                      level === l.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="level"
                      value={l.id}
                      checked={level === l.id}
                      onChange={() => setLevel(l.id)}
                      className="accent-primary-600"
                    />
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${level === l.id ? 'text-primary-700' : 'text-gray-800'}`}>
                        {l.label}
                      </p>
                      <p className="text-xs text-gray-500">{l.desc}</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {l.reduction}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={handleCompress} className="w-full justify-center" size="lg">
              Compress PDF
            </Button>
          </div>
        )}

        {/* Processing */}
        {status === 'processing' && (
          <div className="py-8 text-center space-y-5">
            <div className="w-12 h-12 mx-auto flex items-center justify-center bg-primary-50 text-primary-600 rounded-full">
              <FileDown className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Compressing your PDF…</p>
              <p className="text-xs text-gray-500 mt-1">Processing in your browser, no upload needed</p>
            </div>
            <ProgressBar value={progress} className="max-w-xs mx-auto" />
          </div>
        )}

        {/* Result */}
        {status === 'done' && result && (
          <div className="space-y-5">
            {/* Success bar */}
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-800">Compression complete</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Reduced from {formatFileSize(result.original)} → {formatFileSize(result.compressed)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-black text-emerald-700">{savings}%</div>
                <div className="text-xs text-emerald-600">smaller</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleDownload} size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                Download compressed PDF
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={() => { setFile(null); setResult(null); reset() }}
              >
                New file
              </Button>
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
              {error ?? 'Something went wrong. Please try again.'}
            </p>
            <Button variant="secondary" onClick={() => { setFile(null); reset() }} icon={<RotateCcw className="w-4 h-4" />}>
              Try again
            </Button>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
