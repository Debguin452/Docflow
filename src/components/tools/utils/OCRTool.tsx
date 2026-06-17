import { useState, useCallback } from 'react'
import { ScanText, Copy, Check, Download, RotateCcw } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import Select from '../../ui/Select'
import { getToolBySlug } from '../../../data/tools'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile, formatFileSize } from '../../../lib/validation'

const LANGUAGES = [
  { value: 'eng', label: 'English' },
  { value: 'fra', label: 'French' },
  { value: 'deu', label: 'German' },
  { value: 'spa', label: 'Spanish' },
  { value: 'ita', label: 'Italian' },
  { value: 'por', label: 'Portuguese' },
  { value: 'rus', label: 'Russian' },
  { value: 'jpn', label: 'Japanese' },
  { value: 'kor', label: 'Korean' },
  { value: 'chi_sim', label: 'Chinese (Simplified)' },
  { value: 'chi_tra', label: 'Chinese (Traditional)' },
  { value: 'ara', label: 'Arabic' },
  { value: 'hin', label: 'Hindi' },
  { value: 'nld', label: 'Dutch' },
  { value: 'pol', label: 'Polish' },
  { value: 'tur', label: 'Turkish' },
  { value: 'vie', label: 'Vietnamese' },
]

export default function OCRTool() {
  const tool = getToolBySlug('ocr')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [language, setLanguage] = useState('eng')
  const [progressLabel, setProgressLabel] = useState('')
  const [text, setText] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [copied, setCopied] = useState(false)
  const [wordCount, setWordCount] = useState(0)

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return
    const types = ['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/bmp','image/tiff']
    if (!validateFile(f, { allowedTypes: types }).valid) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f); setText(''); setConfidence(0); reset()
    setPreviewUrl(URL.createObjectURL(f))
  }, [previewUrl, reset])

  const handleOCR = useCallback(async () => {
    if (!file) return
    trackToolUse('ocr')
    await process(async onProgress => {
      setProgressLabel('Loading OCR engine…')
      onProgress(5)

      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker(language, 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'loading tesseract core') {
            setProgressLabel('Loading engine (first run downloads ~10MB)…')
            onProgress(10)
          } else if (m.status === 'initializing tesseract') {
            setProgressLabel('Initialising…'); onProgress(20)
          } else if (m.status === 'loading language traineddata') {
            setProgressLabel(`Loading ${language} language data…`); onProgress(35)
          } else if (m.status === 'recognizing text') {
            setProgressLabel('Recognising text…')
            onProgress(40 + Math.round(m.progress * 55))
          }
        },
      })

      const { data } = await worker.recognize(file)
      await worker.terminate()

      const extracted = data.text.trim()
      const conf = Math.round(data.confidence)
      setText(extracted)
      setConfidence(conf)
      setWordCount(extracted.split(/\s+/).filter(Boolean).length)
      onProgress(100)
    })
  }, [file, language, process, trackToolUse])

  const copyText = async () => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const downloadTxt = () => {
    if (!text || !file) return
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = file.name.replace(/\.[^.]+$/, '') + '-ocr.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'What image types give the best OCR accuracy?', answer: 'Scanned documents at 300 DPI or higher, high contrast (dark text on white background), properly oriented text. Blurry or low-contrast images significantly reduce accuracy.' },
      { question: 'Why does the first run take longer?', answer: 'Tesseract downloads the engine core (~10 MB) and language data (~4 MB per language) on first use. Both are cached in your browser for instant subsequent use.' },
      { question: 'What languages are supported?', answer: '17 languages including English, French, German, Spanish, Chinese, Japanese, Arabic, and more. The language model downloads automatically when selected.' },
    ]}>
      <div className="p-6 space-y-5">
        {!file && (
          <DropZone onFiles={handleFile}
            accept={{ 'image/*': ['.jpg','.jpeg','.png','.webp','.gif','.bmp','.tiff','.tif'] }}
            label="Drop your image here"
            sublabel="Any image with text — scanned documents, photos, screenshots" />
        )}

        {file && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
            {previewUrl && <img src={previewUrl} alt="" className="w-10 h-10 object-cover rounded border border-gray-200 shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
              <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
            </div>
            <button onClick={() => { setFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setText(''); reset() }}
              className="text-xs text-gray-400 hover:text-gray-600 shrink-0">Remove</button>
          </div>
        )}

        {file && status === 'idle' && (
          <>
            <Select label="Document language" options={LANGUAGES} value={language}
              onChange={e => setLanguage(e.target.value)} />
            <Button onClick={handleOCR} className="w-full justify-center" size="lg" icon={<ScanText className="w-4 h-4" />}>
              Extract Text
            </Button>
          </>
        )}

        {status === 'processing' && (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm font-semibold text-gray-700">{progressLabel || 'Processing…'}</p>
            <ProgressBar value={progress} className="max-w-xs mx-auto" />
            <p className="text-xs text-gray-400">All processing is local — no upload needed</p>
          </div>
        )}

        {status === 'done' && text && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              <span><strong>{wordCount}</strong> words</span>
              <span><strong>{text.length}</strong> characters</span>
              <span className={`font-semibold ${confidence >= 80 ? 'text-emerald-600' : confidence >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                {confidence}% confidence
              </span>
            </div>

            {/* Text output */}
            <div className="relative">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={12}
                className="w-full px-3 py-3 text-sm border border-gray-200 rounded-xl font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                aria-label="Extracted text (editable)"
              />
              <p className="absolute bottom-2 right-3 text-[10px] text-gray-300 select-none">editable</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={copyText} variant="secondary" className="flex-1 justify-center"
                icon={copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}>
                {copied ? 'Copied!' : 'Copy text'}
              </Button>
              <Button onClick={downloadTxt} variant="secondary" className="flex-1 justify-center" icon={<Download className="w-4 h-4" />}>
                Download .txt
              </Button>
              <Button variant="secondary" onClick={() => { setText(''); setConfidence(0); reset() }} icon={<RotateCcw className="w-4 h-4" />}>
                Re-scan
              </Button>
            </div>
          </div>
        )}

        {status === 'done' && !text && (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500">No text detected in this image.</p>
            <p className="text-xs text-gray-400 mt-1">Try a higher resolution image or ensure text is clearly visible.</p>
            <Button variant="secondary" onClick={reset} className="mt-4" icon={<RotateCcw className="w-4 h-4" />}>Try again</Button>
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
