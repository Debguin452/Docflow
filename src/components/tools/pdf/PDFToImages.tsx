import { useState, useCallback } from 'react'
import { ImageIcon, Download, RotateCcw, CheckCircle2 } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import Select from '../../ui/Select'
import { getToolBySlug } from '../../../data/tools'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile, ACCEPT, formatFileSize } from '../../../lib/validation'
import { downloadAsZip } from '../../../lib/zip'

type ImgFormat = 'image/jpeg' | 'image/png' | 'image/webp'
interface RenderedPage { blob: Blob; url: string; name: string; size: number }

async function renderPDFToImages(
  file: File,
  format: ImgFormat,
  quality: number,
  onProgress: (pct: number) => void,
): Promise<RenderedPage[]> {
  // Dynamically import pdfjs to keep initial bundle small
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const totalPages = pdf.numPages
  const results: RenderedPage[] = []
  const baseName = file.name.replace(/\.pdf$/i, '')
  const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp'

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 2.0 }) // 2x = ~200 DPI

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!

    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    await page.render({ canvasContext: ctx, viewport }).promise

    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob(b => b ? res(b) : rej(new Error('Canvas export failed')), format, quality),
    )

    const url = URL.createObjectURL(blob)
    results.push({ blob, url, name: `${baseName}-page-${pageNum}.${ext}`, size: blob.size })
    onProgress(Math.round((pageNum / totalPages) * 90) + 5)
  }

  return results
}

export default function PDFToImages() {
  const tool = getToolBySlug('pdf-to-images')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<ImgFormat>('image/jpeg')
  const [quality, setQuality] = useState(0.92)
  const [pages, setPages] = useState<RenderedPage[]>([])

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    const v = validateFile(f, { allowedTypes: ['application/pdf'] })
    if (!v.valid) return
    // Revoke old URLs
    pages.forEach(p => URL.revokeObjectURL(p.url))
    setFile(f); setPages([]); reset()
  }, [pages, reset])

  const handleConvert = useCallback(async () => {
    if (!file) return
    trackToolUse('pdf-to-images')
    await process(async onProgress => {
      onProgress(5)
      const rendered = await renderPDFToImages(file, format, quality, onProgress)
      setPages(rendered)
      onProgress(100)
    })
  }, [file, format, quality, process, trackToolUse])

  const handleDownloadAll = async () => {
    if (pages.length === 1) {
      const a = document.createElement('a')
      a.href = pages[0].url; a.download = pages[0].name; a.click()
      return
    }
    await downloadAsZip(
      pages.map(p => ({ name: p.name, data: p.blob })),
      `${file?.name.replace(/\.pdf$/i, '') ?? 'pages'}-images.zip`,
    )
  }

  const fmtOptions = [
    { value: 'image/jpeg', label: 'JPG (smaller, no transparency)' },
    { value: 'image/png', label: 'PNG (lossless, larger)' },
    { value: 'image/webp', label: 'WEBP (smallest, modern browsers)' },
  ]

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'What resolution are the exported images?', answer: 'Pages are rendered at 2× scale (approximately 200 DPI). For most screens and presentations this is ideal. Print use may require higher resolution.' },
      { question: 'How many pages can I convert?', answer: 'There is no page limit. Large PDFs with many pages will take longer to process but will complete without restrictions.' },
      { question: 'Which format should I choose?', answer: 'JPG is best for most uses (photos, presentations). PNG is ideal when you need perfect quality or transparency. WEBP is smallest for web use.' },
    ]}>
      <div className="p-6 space-y-5">
        {!file && (
          <DropZone onFiles={handleFile} accept={ACCEPT.pdf} label="Drop your PDF here" sublabel="Each page will be exported as an image" />
        )}

        {file && status === 'idle' && (
          <>
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
              <ImageIcon className="w-4 h-4 text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
              </div>
              <button onClick={() => { setFile(null); reset() }} className="text-xs text-gray-400 hover:text-gray-600">Remove</button>
            </div>

            <Select
              label="Output format"
              options={fmtOptions}
              value={format}
              onChange={e => setFormat(e.target.value as ImgFormat)}
            />

            {format !== 'image/png' && (
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Quality</label>
                  <span className="text-sm font-semibold text-primary-600">{Math.round(quality * 100)}%</span>
                </div>
                <input type="range" min={50} max={100} step={1} value={Math.round(quality * 100)}
                  onChange={e => setQuality(Number(e.target.value) / 100)}
                  className="w-full accent-primary-600" aria-label="Quality" />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Smaller file</span><span>Best quality</span>
                </div>
              </div>
            )}

            <Button onClick={handleConvert} className="w-full justify-center" size="lg" icon={<ImageIcon className="w-4 h-4" />}>
              Convert to Images
            </Button>
          </>
        )}

        {status === 'processing' && (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm font-semibold text-gray-700">Rendering pages…</p>
            <ProgressBar value={progress} label="Processing" className="max-w-xs mx-auto" />
            <p className="text-xs text-gray-400">First run downloads the PDF renderer (~3 MB, cached after)</p>
          </div>
        )}

        {status === 'done' && pages.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-800">{pages.length} image{pages.length !== 1 ? 's' : ''} ready</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
              {pages.map((p, i) => (
                <a key={i} href={p.url} download={p.name}
                  className="group relative border border-gray-200 rounded-lg overflow-hidden hover:border-primary-300 transition-colors">
                  <img src={p.url} alt={`Page ${i + 1}`} className="w-full aspect-[3/4] object-cover bg-gray-100" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Download className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="px-1.5 py-1 bg-white border-t border-gray-100">
                    <p className="text-[10px] text-gray-500 text-center">Page {i + 1} · {formatFileSize(p.size)}</p>
                  </div>
                </a>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={handleDownloadAll} size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                {pages.length > 1 ? `Download all (${pages.length}) as ZIP` : 'Download image'}
              </Button>
              <Button variant="secondary" size="lg" icon={<RotateCcw className="w-4 h-4" />}
                onClick={() => { pages.forEach(p => URL.revokeObjectURL(p.url)); setFile(null); setPages([]); reset() }}>
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
