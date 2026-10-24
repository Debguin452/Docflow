import { useState, useRef, useCallback } from 'react'
import { Copy, Check, Camera, Upload, RotateCcw } from 'lucide-react'
import jsQR from 'jsqr'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import { getToolBySlug } from '../../../data/tools'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile } from '../../../lib/validation'

type ScanMode = 'upload' | 'camera'
type ScanResult = { text: string; url?: string } | null

function decodeQRFromCanvas(canvas: HTMLCanvasElement): ScanResult {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
  if (!code) return null
  const text = code.data
  const url = text.match(/^https?:\/\//) ? text : undefined
  return { text, url }
}

export default function QRScanner() {
  const tool = getToolBySlug('qr-scanner')!
  const { trackToolUse } = useAnalytics()
  const [mode, setMode] = useState<ScanMode>('upload')
  const [result, setResult] = useState<ScanResult>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animRef = useRef<number>(0)

  const scanImageFile = useCallback(async (files: File[]) => {
    const f = files[0]; if (!f) return
    const types = ['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/bmp']
    if (!validateFile(f, { allowedTypes: types }).valid) { setError('Unsupported image format.'); return }
    setError(null); setResult(null); setScanning(true)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width; canvas.height = img.height
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      const found = decodeQRFromCanvas(canvas)
      if (found) {
        setResult(found)
        trackToolUse('qr-scanner')
      } else {
        setError('No QR code found in this image. Try a higher resolution or better-lit photo.')
      }
      setScanning(false)
    }
    img.onerror = () => { setError('Failed to load image.'); setScanning(false) }
    img.src = url
  }, [previewUrl, trackToolUse])

  const startCamera = useCallback(async () => {
    setError(null); setResult(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      const scanFrame = () => {
        const video = videoRef.current
        if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
          animRef.current = requestAnimationFrame(scanFrame); return
        }
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth; canvas.height = video.videoHeight
        canvas.getContext('2d')!.drawImage(video, 0, 0)
        const found = decodeQRFromCanvas(canvas)
        if (found) {
          setResult(found)
          trackToolUse('qr-scanner')
          stopCamera()
        } else {
          animRef.current = requestAnimationFrame(scanFrame)
        }
      }
      animRef.current = requestAnimationFrame(scanFrame)
    } catch {
      setError('Camera access denied or not available. Try uploading an image instead.')
    }
  }, [trackToolUse])

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const switchMode = (m: ScanMode) => {
    stopCamera(); setMode(m); setResult(null); setError(null)
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
    if (m === 'camera') startCamera()
  }

  const copyResult = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result.text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    stopCamera(); setResult(null); setError(null); setScanning(false)
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
    if (mode === 'camera') startCamera()
  }

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'What types of QR codes can be scanned?', answer: 'All standard QR codes — URLs, text, WiFi, vCards, email, phone, and more. The decoded content is shown as plain text.' },
      { question: 'Why wasn\'t my QR code detected?', answer: 'Common causes: image too blurry, QR code too small, poor lighting, or low contrast. Try a higher resolution image or ensure the QR fills at least 30% of the frame.' },
      { question: 'Is camera scanning safe?', answer: 'Yes. Camera frames are processed locally in your browser using jsQR. No video or images are transmitted to any server.' },
    ]}>
      <div className="p-6 space-y-5">
        {/* Mode switcher */}
        <div className="flex gap-2">
          <button onClick={() => switchMode('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg border transition-colors ${mode === 'upload' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            <Upload className="w-4 h-4" /> Upload Image
          </button>
          <button onClick={() => switchMode('camera')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg border transition-colors ${mode === 'camera' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            <Camera className="w-4 h-4" /> Use Camera
          </button>
        </div>

        {/* Upload mode */}
        {mode === 'upload' && !previewUrl && (
          <DropZone onFiles={scanImageFile} accept={{ 'image/*': ['.jpg','.jpeg','.png','.webp','.gif','.bmp'] }}
            label="Drop image with QR code" sublabel="JPG, PNG, WEBP, GIF — any image containing a QR code" />
        )}

        {mode === 'upload' && previewUrl && (
          <div className="flex flex-col items-center gap-4">
            <img src={previewUrl} alt="Uploaded QR code" className="max-h-48 rounded-xl border border-gray-200 object-contain" />
            {scanning && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                Scanning…
              </div>
            )}
          </div>
        )}

        {/* Camera mode */}
        {mode === 'camera' && !result && (
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-white/70 rounded-xl" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)' }} />
            </div>
            <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/70">
              Point camera at QR code — scanning automatically
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="space-y-3">
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
            <Button variant="secondary" onClick={reset} size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />}>Try again</Button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">QR Code Content</p>
                  <p className="text-sm text-gray-900 break-all font-mono leading-relaxed">{result.text}</p>
                </div>
                <button onClick={copyResult} className="shrink-0 p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" aria-label="Copy decoded text">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {result.url && (
                <a href={result.url} target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:underline">
                  Open URL →
                </a>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={copyResult} variant="secondary" className="flex-1 justify-center" icon={copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}>
                {copied ? 'Copied!' : 'Copy text'}
              </Button>
              <Button variant="secondary" onClick={reset} icon={<RotateCcw className="w-4 h-4" />}>
                Scan another
              </Button>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
