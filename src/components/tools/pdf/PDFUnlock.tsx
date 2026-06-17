import { useState, useCallback } from 'react'
import { Unlock, Download, RotateCcw, CheckCircle2 } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import Input from '../../ui/Input'
import { getToolBySlug } from '../../../data/tools'
import { unlockPDF, downloadBytes, formatFileSize } from '../../../lib/pdf/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile, ACCEPT } from '../../../lib/validation'

export default function PDFUnlock() {
  const tool = getToolBySlug('pdf-unlock')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null)

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return
    if (!validateFile(f, { allowedTypes: ['application/pdf'] }).valid) return
    setFile(f); setResultBytes(null); reset()
  }, [reset])

  const handleUnlock = useCallback(async () => {
    if (!file) return
    trackToolUse('pdf-unlock')
    await process(async onProgress => {
      onProgress(30)
      const bytes = await unlockPDF(file, password)
      onProgress(90)
      setResultBytes(bytes)
      onProgress(100)
    })
  }, [file, password, process, trackToolUse])

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'What types of PDF passwords can be removed?', answer: 'User passwords (required to open the PDF) and owner passwords (restricting editing/copying). You must know the password to remove it.' },
      { question: 'Does this work without knowing the password?', answer: 'No. We never attempt brute-force attacks. You must provide the correct password. This tool is for unlocking PDFs you already have permission to access.' },
      { question: 'Is the password sent to any server?', answer: 'No. All processing happens in your browser. Your password never leaves your device.' },
    ]}>
      <div className="p-6 space-y-5">
        {!file && (
          <DropZone onFiles={handleFile} accept={ACCEPT.pdf}
            label="Drop your password-protected PDF"
            sublabel="You'll need to enter the correct password" />
        )}

        {file && status === 'idle' && (
          <>
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
              <Unlock className="w-4 h-4 text-orange-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
              </div>
              <button onClick={() => { setFile(null); reset() }} className="text-xs text-gray-400 hover:text-gray-600">Remove</button>
            </div>

            <Input
              label="PDF Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter the PDF password"
              hint="Leave blank if the PDF only has owner restrictions (no open password)"
              autoComplete="current-password"
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            />

            <Button onClick={handleUnlock} className="w-full justify-center" size="lg"
              icon={<Unlock className="w-4 h-4" />}>
              Unlock PDF
            </Button>
          </>
        )}

        {status === 'processing' && (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm font-semibold text-gray-700">Removing password…</p>
            <ProgressBar value={progress} className="max-w-xs mx-auto" />
          </div>
        )}

        {status === 'done' && resultBytes && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">PDF unlocked</p>
                <p className="text-xs text-emerald-600">Password removed — {formatFileSize(resultBytes.length)}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => downloadBytes(resultBytes!, file!.name.replace('.pdf', '-unlocked.pdf'))}
                size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                Download unlocked PDF
              </Button>
              <Button variant="secondary" size="lg" icon={<RotateCcw className="w-4 h-4" />}
                onClick={() => { setFile(null); setResultBytes(null); setPassword(''); reset() }}>
                New file
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error?.includes('password') || error?.includes('Password')
                ? 'Incorrect password. Please check the password and try again.'
                : error}
            </p>
            <Button variant="secondary" onClick={reset} icon={<RotateCcw className="w-4 h-4" />}>Try again</Button>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
