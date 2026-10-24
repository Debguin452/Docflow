import { useState, useCallback, useRef, useEffect } from 'react'
import { Crop, Download, RotateCcw, CheckCircle2 } from 'lucide-react'
import ToolLayout from '../ToolLayout'
import DropZone from '../../ui/DropZone'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import { getToolBySlug } from '../../../data/tools'
import { cropImage, getImageDimensions, downloadBlob, getOutputFilename } from '../../../lib/image/operations'
import { useFileProcess } from '../../../hooks/useFileProcess'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { validateFile, formatFileSize } from '../../../lib/validation'

interface CropArea { x: number; y: number; w: number; h: number }

const RATIOS: Record<string, [number, number] | null> = {
  Free: null, '1:1': [1, 1], '4:3': [4, 3], '16:9': [16, 9], '3:2': [3, 2],
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }

export default function CropImage() {
  const tool = getToolBySlug('crop-image')!
  const { status, error, reset, process } = useFileProcess()
  const { trackToolUse } = useAnalytics()
  const [file, setFile] = useState<File | null>(null)
  const [origW, setOrigW] = useState(0)
  const [origH, setOrigH] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [ratio, setRatio] = useState<string>('Free')
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, w: 0, h: 0 })
  const [xStr, setXStr] = useState('0')
  const [yStr, setYStr] = useState('0')
  const [wStr, setWStr] = useState('0')
  const [hStr, setHStr] = useState('0')
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  // Sync string inputs → crop state
  const applyInputs = useCallback(() => {
    const x = clamp(parseInt(xStr, 10) || 0, 0, origW)
    const y = clamp(parseInt(yStr, 10) || 0, 0, origH)
    const w = clamp(parseInt(wStr, 10) || 0, 1, origW - x)
    const h = clamp(parseInt(hStr, 10) || 0, 1, origH - y)
    setCrop({ x, y, w, h })
  }, [xStr, yStr, wStr, hStr, origW, origH])

  // Draw preview on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !origW) return
    const SCALE = Math.min(560 / origW, 360 / origH, 1)
    canvas.width = origW * SCALE
    canvas.height = origH * SCALE
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // Clear crop area
    const cx = crop.x * SCALE, cy = crop.y * SCALE, cw = crop.w * SCALE, ch = crop.h * SCALE
    ctx.clearRect(cx, cy, cw, ch)
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, cx, cy, cw, ch)
    // Border
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 2
    ctx.strokeRect(cx, cy, cw, ch)
    // Handles
    const hs = 7
    ctx.fillStyle = '#2563eb'
    ;[[cx,cy],[cx+cw,cy],[cx,cy+ch],[cx+cw,cy+ch]].forEach(([hx,hy]) => {
      ctx.fillRect(hx - hs/2, hy - hs/2, hs, hs)
    })
  }, [crop, origW, origH, previewUrl])

  // Canvas mouse drag to define crop
  const getCanvasXY = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const SCALE = Math.min(560 / origW, 360 / origH, 1)
    return {
      x: clamp(Math.round((e.clientX - rect.left) / SCALE), 0, origW),
      y: clamp(Math.round((e.clientY - rect.top) / SCALE), 0, origH),
    }
  }

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasXY(e)
    setDragStart({ x, y })
    setDragging(true)
  }

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return
    const { x, y } = getCanvasXY(e)
    let x0 = Math.min(dragStart.x, x), x1 = Math.max(dragStart.x, x)
    let y0 = Math.min(dragStart.y, y), y1 = Math.max(dragStart.y, y)
    if (RATIOS[ratio]) {
      const [rw, rh] = RATIOS[ratio]!
      const dw = x1 - x0
      const target = Math.max(dw, Math.round(dw * rh / rw))
      x1 = x0 + Math.round(target * rw / rh)
      y1 = y0 + target
      x1 = clamp(x1, 0, origW); y1 = clamp(y1, 0, origH)
    }
    const newCrop = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
    setCrop(newCrop)
    setXStr(String(newCrop.x)); setYStr(String(newCrop.y))
    setWStr(String(newCrop.w)); setHStr(String(newCrop.h))
  }

  const onMouseUp = () => setDragging(false)

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0]; if (!f) return
    const types = ['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/bmp']
    if (!validateFile(f, { allowedTypes: types }).valid) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    setFile(f); setResultBlob(null); setResultUrl(null); reset()
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
    const dims = await getImageDimensions(f)
    setOrigW(dims.width); setOrigH(dims.height)
    const initialCrop = { x: 0, y: 0, w: dims.width, h: dims.height }
    setCrop(initialCrop)
    setXStr('0'); setYStr('0'); setWStr(String(dims.width)); setHStr(String(dims.height))
    // Pre-load image for canvas
    const img = new Image(); img.src = url
    img.onload = () => { imgRef.current = img }
  }, [previewUrl, resultUrl, reset])

  const applyRatioPreset = (r: string) => {
    setRatio(r)
    if (!RATIOS[r] || !origW) return
    const [rw, rh] = RATIOS[r]!
    const size = Math.min(origW, Math.round(origW * rh / rw), origH, Math.round(origH * rw / rh))
    const w = size, h = Math.round(size * rh / rw)
    const x = Math.round((origW - w) / 2), y = Math.round((origH - h) / 2)
    setCrop({ x, y, w, h })
    setXStr(String(x)); setYStr(String(y)); setWStr(String(w)); setHStr(String(h))
  }

  const handleCrop = useCallback(async () => {
    if (!file || crop.w <= 0 || crop.h <= 0) return
    trackToolUse('crop-image')
    await process(async onProgress => {
      onProgress(30)
      const blob = await cropImage(file, { x: crop.x, y: crop.y, width: crop.w, height: crop.h })
      onProgress(90)
      if (resultUrl) URL.revokeObjectURL(resultUrl)
      const url = URL.createObjectURL(blob)
      setResultBlob(blob); setResultUrl(url)
      onProgress(100)
    })
  }, [file, crop, process, trackToolUse, resultUrl])

  return (
    <ToolLayout tool={tool} faqs={[
      { question: 'How do I crop to an exact size?', answer: 'Enter precise pixel values in the X, Y, Width, and Height fields below the canvas for exact crop coordinates.' },
      { question: 'Can I crop to a fixed aspect ratio?', answer: 'Yes. Select a ratio (1:1, 16:9, 4:3) and drag on the canvas — the selection will be constrained to that ratio automatically.' },
      { question: 'Does cropping reduce quality?', answer: 'No. Cropping only removes parts of the image. The remaining area is saved at full original quality.' },
    ]}>
      <div className="p-6 space-y-5">
        {!file && (
          <DropZone onFiles={handleFile} accept={{ 'image/*': ['.jpg','.jpeg','.png','.webp','.gif','.bmp'] }}
            label="Drop your image here" sublabel="Draw a crop area on the canvas after uploading" />
        )}

        {file && status === 'idle' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700 truncate max-w-xs">{file.name} · <span className="text-gray-400">{origW}×{origH} · {formatFileSize(file.size)}</span></p>
              <button onClick={() => { setFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); if (resultUrl) URL.revokeObjectURL(resultUrl); reset() }}
                className="text-xs text-gray-400 hover:text-gray-600 shrink-0">Remove</button>
            </div>

            {/* Ratio presets */}
            <div className="flex gap-1.5 flex-wrap">
              {Object.keys(RATIOS).map(r => (
                <button key={r} onClick={() => applyRatioPreset(r)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${ratio === r ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  {r}
                </button>
              ))}
            </div>

            {/* Canvas */}
            {previewUrl && (
              <div className="overflow-auto rounded-xl border border-gray-200 bg-gray-100 cursor-crosshair">
                <canvas ref={canvasRef} className="block max-w-full"
                  onMouseDown={onMouseDown} onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
                  aria-label="Crop canvas — drag to select crop area" />
              </div>
            )}

            {/* Manual inputs */}
            <div className="grid grid-cols-4 gap-2">
              {[['X', xStr, setXStr],['Y', yStr, setYStr],['W', wStr, setWStr],['H', hStr, setHStr]].map(([label, val, setter]) => (
                <Input key={label as string} label={label as string} type="number" min="0"
                  value={val as string}
                  onChange={e => { (setter as (v: string) => void)(e.target.value) }}
                  onBlur={applyInputs} className="text-center" />
              ))}
            </div>

            {crop.w > 0 && crop.h > 0 && (
              <p className="text-xs text-gray-500">Crop area: <strong>{crop.w} × {crop.h} px</strong> at ({crop.x}, {crop.y})</p>
            )}

            <Button onClick={handleCrop} className="w-full justify-center" size="lg"
              icon={<Crop className="w-4 h-4" />} disabled={crop.w <= 0 || crop.h <= 0}>
              Crop Image
            </Button>
          </>
        )}

        {status === 'processing' && (
          <div className="py-8 text-center">
            <p className="text-sm font-semibold text-gray-700 mb-3">Cropping…</p>
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {status === 'done' && resultBlob && resultUrl && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Crop complete</p>
                <p className="text-xs text-emerald-600">{crop.w} × {crop.h} px · {formatFileSize(resultBlob.size)}</p>
              </div>
              <img src={resultUrl} alt="Cropped preview" className="ml-auto w-16 h-16 object-cover rounded border border-emerald-200 shrink-0" />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => downloadBlob(resultBlob!, getOutputFilename(file!.name, '-cropped'))}
                size="lg" icon={<Download className="w-4 h-4" />} className="flex-1 justify-center">
                Download cropped image
              </Button>
              <Button variant="secondary" size="lg" icon={<RotateCcw className="w-4 h-4" />}
                onClick={() => { URL.revokeObjectURL(resultUrl!); setResultBlob(null); setResultUrl(null); reset() }}>
                Crop again
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
