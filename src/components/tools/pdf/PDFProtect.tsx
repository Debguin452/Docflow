import { useState, useCallback } from 'react'
import { Lock, Download, RotateCcw, CheckCircle2, Info } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import ProgressBar from '../../ui/ProgressBar'
import Input from '../../ui/Input'
import { getToolBySlug } from '../../../data/tools'
import { downloadBytes, formatFileSize } from '../../../lib/pdf/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile, ACCEPT } from '../../../lib/validation'

// pdf-lib has no encryption support, so this uses the pdf-lib-plus-encrypt fork
// (loaded lazily) to apply real RC4/AES password encryption in the browser.
async function encryptPDF(file: File, password: string): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib-plus-encrypt')
  const ab = await file.arrayBuffer()
  let doc
  try {
    doc = await PDFDocument.load(ab)
  } catch {
    throw new Error('Could not read this PDF. It may already be encrypted or corrupted.')
  }
  await doc.encrypt({
    userPassword: password,
    ownerPassword: password,
    permissions: { printing: 'highResolution', copying: true, modifying: false, annotating: false },
  })
  return doc.save({ useObjectStreams: false })
}

export default function PDFProtect() {
  const tool = getToolBySlug('pdf-protect')!
  const { status, progress, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null)

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return
    const v = validateFile(f, { allowedTypes: ['application/pdf'] }); if (!v.valid) return
    setFile(f); setResultBytes(null); reset()
  }, [reset])

  const validate = (): boolean => {
    if (password.length < 4) { setPasswordError('Password must be at least 4 characters.'); return false }
    if (password !== confirmPassword) { setPasswordError('Passwords do not match.'); return false }
    setPasswordError(''); return true
  }

  const handleProtect = useCallback(async () => {
    if (!file || !validate()) return
    trackToolUse('pdf-protect')
    await process(async onProgress => {
      onProgress(30)
      const bytes = await encryptPDF(file, password)
      onProgress(90)
      setResultBytes(bytes)
      onProgress(100)
    })
  }, [file, password, process, trackToolUse])

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'What level of protection does this apply?', answer: 'The PDF is encrypted with the password you choose, entirely in your browser. Anyone opening it will be asked for that password.' },
      { question: 'Will the password prevent opening the PDF?', answer: 'Yes. Compliant PDF viewers will not open the file without the password. Keep the password safe: it cannot be recovered.' },
      { question: 'Is my password sent to any server?', answer: 'No. The password you enter never leaves your browser.' },
    ]}>
      <div className="p-6 space-y-5">
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Remember your password:</strong> it cannot be recovered. Encryption happens
            locally in your browser.
          </p>
        </div>

        {!file && <DropZone onFiles={handleFile} accept={ACCEPT.pdf} label="Drop your PDF here" />}

        {file && status === 'idle' && (
          <>
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
              <Lock className="w-4 h-4 text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
              </div>
              <button onClick={() => { setFile(null); reset() }} className="text-xs text-gray-400 hover:text-gray-600">Remove</button>
            </div>
            <Input label="Password" type="password" value={password}
              onChange={e => { setPassword(e.target.value); setPasswordError('') }}
              placeholder="Enter password" autoComplete="new-password" />
            <Input label="Confirm password" type="password" value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setPasswordError('') }}
              placeholder="Confirm password" error={passwordError} autoComplete="new-password" />
            <Button onClick={handleProtect} className="w-full justify-center" size="lg"
              icon={<Lock className="w-4 h-4" />} disabled={!password || !confirmPassword}>
              Protect PDF
            </Button>
          </>
        )}

        {status === 'processing' && (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm font-semibold text-gray-700">Applying protection…</p>
            <ProgressBar value={progress} className="max-w-xs mx-auto" />
          </div>
        )}

        {status === 'done' && resultBytes && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-800">Protection applied — {formatFileSize(resultBytes.length)}</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => downloadBytes(resultBytes!, file!.name.replace(/\.pdf$/i, '') + '-protected.pdf')}
                size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                Download protected PDF
              </Button>
              <Button variant="secondary" size="lg" icon={<RotateCcw className="w-4 h-4" />}
                onClick={() => { setFile(null); setResultBytes(null); setPassword(''); setConfirmPassword(''); reset() }}>
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
