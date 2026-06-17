import { useState, useCallback } from 'react'
import { FileEdit, Download, RotateCcw, CheckCircle2 } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import Input from '../../ui/Input'
import { getToolBySlug } from '../../../data/tools'
import { editMetadata, getMetadata, downloadBytes, formatFileSize } from '../../../lib/pdf/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile, ACCEPT } from '../../../lib/validation'

interface Meta { title: string; author: string; subject: string; keywords: string; creator: string }

export default function PDFMetadata() {
  const tool = getToolBySlug('pdf-metadata')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [file, setFile] = useState<File | null>(null)
  const [meta, setMeta] = useState<Meta>({ title: '', author: '', subject: '', keywords: '', creator: '' })
  const [pageCount, setPageCount] = useState(0)
  const [fileSize, setFileSize] = useState(0)
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0]; if (!f) return
    if (!validateFile(f, { allowedTypes: ['application/pdf'] }).valid) return
    setFile(f); setResultBytes(null); reset(); setLoading(true)
    try {
      const m = await getMetadata(f)
      setMeta({
        title: m.title ?? '',
        author: m.author ?? '',
        subject: m.subject ?? '',
        keywords: m.keywords ?? '',
        creator: '',
      })
      setPageCount(m.pageCount)
      setFileSize(m.fileSize)
    } catch {
      setMeta({ title: '', author: '', subject: '', keywords: '', creator: '' })
    }
    setLoading(false)
  }, [reset])

  const update = (key: keyof Meta) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setMeta(prev => ({ ...prev, [key]: e.target.value }))

  const handleSave = useCallback(async () => {
    if (!file) return
    trackToolUse('pdf-metadata')
    await process(async onProgress => {
      onProgress(20)
      const bytes = await editMetadata(file, meta)
      onProgress(90)
      setResultBytes(bytes)
      onProgress(100)
    })
  }, [file, meta, process, trackToolUse])

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'What metadata fields can I edit?', answer: 'Title, Author, Subject, Keywords, and Creator. These fields are embedded in the PDF and visible in file properties.' },
      { question: 'Why would I edit PDF metadata?', answer: 'To improve searchability, correct author names before sharing, add keyword tags, or remove identifying metadata before distribution.' },
      { question: 'Does editing metadata change the PDF content?', answer: 'No. Metadata is stored separately from the page content. Editing it does not affect text, images, or layout.' },
    ]}>
      <div className="p-6 space-y-5">
        {!file && !loading && <DropZone onFiles={handleFile} accept={ACCEPT.pdf} label="Drop your PDF here" sublabel="We'll read existing metadata and let you edit it" />}

        {loading && (
          <div className="py-10 text-center">
            <div className="w-7 h-7 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Reading metadata…</p>
          </div>
        )}

        {file && !loading && status === 'idle' && (
          <>
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
              <FileEdit className="w-4 h-4 text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(fileSize || file.size)}{pageCount > 0 && ` · ${pageCount} pages`}
                </p>
              </div>
              <button onClick={() => { setFile(null); reset() }} className="text-xs text-gray-400 hover:text-gray-600">Remove</button>
            </div>

            <div className="space-y-3">
              <Input label="Title" value={meta.title} onChange={update('title')} placeholder="Document title" />
              <Input label="Author" value={meta.author} onChange={update('author')} placeholder="Author name" />
              <Input label="Subject" value={meta.subject} onChange={update('subject')} placeholder="Document subject" />
              <Input label="Keywords" value={meta.keywords} onChange={update('keywords')} placeholder="keyword1, keyword2, keyword3" hint="Comma-separated keywords for searchability" />
              <Input label="Creator application" value={meta.creator} onChange={update('creator')} placeholder="e.g. Microsoft Word" />
            </div>

            <Button onClick={handleSave} className="w-full justify-center" size="lg" icon={<FileEdit className="w-4 h-4" />}>
              Save Metadata
            </Button>
          </>
        )}

        {status === 'processing' && (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm font-semibold text-gray-700">Updating metadata…</p>
            <ProgressBar value={progress} className="max-w-xs mx-auto" />
          </div>
        )}

        {status === 'done' && resultBytes && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-800">Metadata updated — {formatFileSize(resultBytes.length)}</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => downloadBytes(resultBytes!, file!.name.replace('.pdf', '-updated.pdf'))}
                size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                Download updated PDF
              </Button>
              <Button variant="secondary" size="lg" icon={<RotateCcw className="w-4 h-4" />}
                onClick={() => { setFile(null); setResultBytes(null); reset() }}>
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
