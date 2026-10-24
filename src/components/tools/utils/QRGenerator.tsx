import { useState, useEffect, useRef, useCallback } from 'react'
import { Download, Copy, Check } from 'lucide-react'
import QRCode from 'qrcode'
import ToolLayout from '../ToolLayout'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import Select from '../../ui/Select'
import Slider from '../../ui/Slider'
import { getToolBySlug } from '../../../data/tools'
import { useAnalytics } from '../../../hooks/useAnalytics'

type QRType = 'url' | 'text' | 'email' | 'phone' | 'wifi'
type ECC = 'L' | 'M' | 'Q' | 'H'

const TYPE_OPTS = [
  { value: 'url', label: 'URL / Website' },
  { value: 'text', label: 'Plain text' },
  { value: 'email', label: 'Email address' },
  { value: 'phone', label: 'Phone number' },
  { value: 'wifi', label: 'WiFi credentials' },
]

const ECC_OPTS = [
  { value: 'L', label: 'Low (7%) — fastest scan' },
  { value: 'M', label: 'Medium (15%) — recommended' },
  { value: 'Q', label: 'Quartile (25%) — with logo' },
  { value: 'H', label: 'High (30%) — most resilient' },
]

function buildQRContent(type: QRType, values: Record<string, string>): string {
  switch (type) {
    case 'url': return values.url?.trim() || ''
    case 'text': return values.text?.trim() || ''
    case 'email': return values.email?.trim() ? `mailto:${values.email.trim()}${values.subject ? `?subject=${encodeURIComponent(values.subject)}` : ''}` : ''
    case 'phone': return values.phone?.trim() ? `tel:${values.phone.trim()}` : ''
    case 'wifi': {
      const { ssid = '', password = '', security = 'WPA' } = values
      return ssid ? `WIFI:T:${security};S:${ssid};P:${password};;` : ''
    }
    default: return ''
  }
}

export default function QRGenerator() {
  const tool = getToolBySlug('qr-generator')!
  const { trackToolUse } = useAnalytics()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [type, setType] = useState<QRType>('url')
  const [values, setValues] = useState<Record<string, string>>({ url: '', text: '', email: '', subject: '', phone: '', ssid: '', password: '', security: 'WPA' })
  const [size, setSize] = useState(300)
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [ecc, setEcc] = useState<ECC>('M')
  const [margin, setMargin] = useState(2)
  const [copied, setCopied] = useState(false)
  const [hasContent, setHasContent] = useState(false)

  const val = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValues(prev => ({ ...prev, [key]: e.target.value }))

  const content = buildQRContent(type, values)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!content) {
      const ctx = canvas.getContext('2d')!
      canvas.width = size; canvas.height = size
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, size, size)
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      ctx.setLineDash([6, 4])
      ctx.strokeRect(16, 16, size - 32, size - 32)
      ctx.fillStyle = '#9ca3af'
      ctx.font = '14px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('QR preview', size / 2, size / 2)
      setHasContent(false)
      return
    }

    QRCode.toCanvas(canvas, content, {
      width: size,
      margin,
      errorCorrectionLevel: ecc,
      color: { dark: fgColor, light: bgColor },
    }).then(() => {
      setHasContent(true)
      trackToolUse('qr-generator')
    }).catch(() => setHasContent(false))
  }, [content, size, fgColor, bgColor, ecc, margin, trackToolUse])

  const downloadPNG = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !hasContent) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'qrcode.png'
    a.click()
  }, [hasContent])

  const downloadSVG = useCallback(async () => {
    if (!content) return
    const svg = await QRCode.toString(content, {
      type: 'svg',
      margin,
      errorCorrectionLevel: ecc,
      color: { dark: fgColor, light: bgColor },
    })
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'qrcode.svg'; a.click()
    URL.revokeObjectURL(url)
  }, [content, fgColor, bgColor, ecc, margin])

  const copyContent = async () => {
    if (!content) return
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'What types of QR codes can I generate?', answer: 'URLs, plain text, email addresses (with optional subject), phone numbers, and WiFi credentials. All standard QR code content types.' },
      { question: 'What is error correction level?', answer: 'Higher error correction lets the QR code be scanned even when partially damaged or covered. Use High (H) if you plan to overlay a logo. Use Low (L) for maximum density.' },
      { question: 'Can I download the QR as a vector (SVG)?', answer: 'Yes. Use the "Download SVG" button for scalable vector format, ideal for print materials.' },
    ]}>
      <div className="p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Settings */}
          <div className="space-y-4">
            <Select label="QR code type" options={TYPE_OPTS} value={type}
              onChange={e => { setType(e.target.value as QRType); setValues(prev => ({ ...prev })) }} />

            {type === 'url' && <Input label="URL" value={values.url} onChange={val('url')} placeholder="https://example.com" type="url" />}
            {type === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Text content</label>
                <textarea value={values.text} onChange={e => setValues(p => ({ ...p, text: e.target.value }))}
                  rows={4} placeholder="Enter any text…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
              </div>
            )}
            {type === 'email' && (
              <div className="space-y-3">
                <Input label="Email address" value={values.email} onChange={val('email')} placeholder="you@example.com" type="email" />
                <Input label="Subject (optional)" value={values.subject} onChange={val('subject')} placeholder="Hello there" />
              </div>
            )}
            {type === 'phone' && <Input label="Phone number" value={values.phone} onChange={val('phone')} placeholder="+1 555 000 0000" type="tel" />}
            {type === 'wifi' && (
              <div className="space-y-3">
                <Input label="Network name (SSID)" value={values.ssid} onChange={val('ssid')} placeholder="MyNetwork" />
                <Input label="Password" value={values.password} onChange={val('password')} placeholder="Password" type="password" />
                <Select label="Security type"
                  options={[{ value: 'WPA', label: 'WPA/WPA2' }, { value: 'WEP', label: 'WEP' }, { value: 'nopass', label: 'None (open)' }]}
                  value={values.security} onChange={val('security')} />
              </div>
            )}

            <div className="pt-2 space-y-3 border-t border-gray-100">
              <Slider label="Size" min={100} max={600} step={10} value={size}
                displayValue={`${size}×${size}`} onChange={setSize} />
              <Slider label="Margin (modules)" min={0} max={8} value={margin}
                displayValue={String(margin)} onChange={setMargin} />
              <Select label="Error correction" options={ECC_OPTS} value={ecc}
                onChange={e => setEcc(e.target.value as ECC)} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Foreground</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)}
                      className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0.5" />
                    <span className="text-xs font-mono text-gray-500">{fgColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Background</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                      className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0.5" />
                    <span className="text-xs font-mono text-gray-500">{bgColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-full flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl p-4">
              <canvas ref={canvasRef} className="max-w-full rounded" style={{ imageRendering: 'pixelated' }} />
            </div>

            {content && (
              <div className="flex items-center gap-2 w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                <p className="text-xs text-gray-500 flex-1 truncate font-mono">{content}</p>
                <button onClick={copyContent} className="shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Copy content">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            <div className="flex gap-2 w-full">
              <Button onClick={downloadPNG} disabled={!hasContent} className="flex-1 justify-center" icon={<Download className="w-4 h-4" />}>
                PNG
              </Button>
              <Button onClick={downloadSVG} disabled={!hasContent} variant="secondary" className="flex-1 justify-center" icon={<Download className="w-4 h-4" />}>
                SVG
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
