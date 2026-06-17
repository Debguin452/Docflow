import { useState, useCallback } from 'react'
import { FileImage, Download, RotateCcw, CheckCircle2 } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import { getToolBySlug } from '../../../data/tools'
import { convertImageFormat, downloadBlob, getOutputFilename, formatFileSize } from '../../../lib/image/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile } from '../../../lib/validation'
import { downloadAsZip } from '../../../lib/zip'

interface Result { file: File; blob: Blob; url: string }

export default function JPGtoPNG() {
  const tool = getToolBySlug('jpg-to-png')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<Result[]>([])

  const handleFiles = useCallback((newFiles: File[]) => {
    const valid = newFiles.filter(f => validateFile(f, { allowedTypes: ['image/jpeg','image/jpg'] }).valid)
    setFiles(prev => [...prev, ...valid]); setResults([]); reset()
  }, [reset])

  const handleConvert = useCallback(async () => {
    if (!files.length) return
    trackToolUse('jpg-to-png')
    await process(async onProgress => {
      const out: Result[] = []
      for (let i = 0; i < files.length; i++) {
        const blob = await convertImageFormat(files[i], 'png', 1.0)
        out.push({ file: files[i], blob, url: URL.createObjectURL(blob) })
        onProgress(Math.round(((i + 1) / files.length) * 95))
      }
      setResults(out); onProgress(100)
    })
  }, [files, process, trackToolUse])

  const downloadAll = async () => {
    if (results.length === 1) { downloadBlob(results[0].blob, getOutputFilename(results[0].file.name, '', 'png')); return }
    await downloadAsZip(results.map(r => ({ name: getOutputFilename(r.file.name, '', 'png'), data: r.blob })), 'jpg-to-png.zip')
  }

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'Why convert JPG to PNG?', answer: 'PNG supports transparency (alpha channel) and is lossless. Use it when you need to edit the image further, add a transparent background, or preserve exact pixel values.' },
      { question: 'Will the quality improve when converting to PNG?', answer: 'No. PNG is lossless going forward, but JPG compression artifacts from the original file are already baked in and cannot be reversed.' },
      { question: 'Can I convert multiple JPGs at once?', answer: 'Yes — drop multiple JPG files and all will be converted to PNG in one batch.' },
    ]}>
      <div className="p-6 space-y-5">
        <DropZone onFiles={handleFiles}
          accept={{ 'image/jpeg': ['.jpg','.jpeg'] }}
          multiple label="Drop JPG files here" sublabel="JPEG / JPG only — convert to PNG losslessly" />

        {files.length > 0 && status === 'idle' && (
          <>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                  <FileImage className="w-4 h-4 text-orange-500 shrink-0" />
                  <p className="text-xs text-gray-700 flex-1 truncate">{f.name}</p>
                  <span className="text-xs text-gray-400 shrink-0">{formatFileSize(f.size)}</span>
                  <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500 text-xs ml-1">✕</button>
                </div>
              ))}
            </div>
            <Button onClick={handleConvert} className="w-full justify-center" size="lg" icon={<FileImage className="w-4 h-4" />}>
              Convert {files.length} JPG{files.length !== 1 ? 's' : ''} to PNG
            </Button>
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
              <p className="text-sm font-semibold text-emerald-800">{results.length} PNG file{results.length !== 1 ? 's' : ''} ready</p>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                  <img src={r.url} alt="" className="w-6 h-6 object-cover rounded shrink-0" />
                  <p className="text-xs text-gray-700 flex-1 truncate">{getOutputFilename(r.file.name,'','png')}</p>
                  <span className="text-xs text-gray-400">{formatFileSize(r.blob.size)}</span>
                  <button onClick={() => downloadBlob(r.blob, getOutputFilename(r.file.name,'','png'))} className="text-primary-600 hover:text-primary-700 ml-1">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button onClick={downloadAll} size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                {results.length > 1 ? 'Download all as ZIP' : 'Download PNG'}
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
