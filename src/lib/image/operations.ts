import imageCompression from 'browser-image-compression'

// ─── Types ─────────────────────────────────────────────────────────────────
export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp'

export interface CompressOptions {
  quality: number           // 0–1
  maxWidthOrHeight?: number
  onProgress?: (pct: number) => void
}

export interface ResizeOptions {
  width?: number
  height?: number
  maintainAspectRatio?: boolean
  format?: ImageFormat
  quality?: number
}

export interface CropOptions {
  x: number
  y: number
  width: number
  height: number
  format?: ImageFormat
  quality?: number
}

// ─── Compress ──────────────────────────────────────────────────────────────
export async function compressImage(
  file: File,
  options: CompressOptions,
): Promise<File> {
  const compressed = await imageCompression(file, {
    maxSizeMB: file.size / 1024 / 1024,          // start from original size
    initialQuality: options.quality,
    maxWidthOrHeight: options.maxWidthOrHeight,
    useWebWorker: true,
    onProgress: options.onProgress,
    fileType: file.type as string,
  })
  return compressed
}

// ─── Resize ────────────────────────────────────────────────────────────────
export async function resizeImage(
  file: File,
  options: ResizeOptions,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      let targetW = options.width ?? img.width
      let targetH = options.height ?? img.height

      if (options.maintainAspectRatio !== false) {
        if (options.width && !options.height) {
          targetH = Math.round((img.height / img.width) * targetW)
        } else if (options.height && !options.width) {
          targetW = Math.round((img.width / img.height) * targetH)
        } else if (options.width && options.height) {
          const scale = Math.min(options.width / img.width, options.height / img.height)
          targetW = Math.round(img.width * scale)
          targetH = Math.round(img.height * scale)
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, targetW, targetH)

      const fmt = options.format ?? 'jpeg'
      const quality = options.quality ?? 0.92
      canvas.toBlob(
        blob => {
          if (!blob) return reject(new Error('Resize failed'))
          resolve(blob)
        },
        `image/${fmt}`,
        quality,
      )
      URL.revokeObjectURL(url)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

// ─── Crop ──────────────────────────────────────────────────────────────────
export async function cropImage(
  file: File,
  cropArea: CropOptions,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = cropArea.width
      canvas.height = cropArea.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(
        img,
        cropArea.x, cropArea.y, cropArea.width, cropArea.height,
        0, 0, cropArea.width, cropArea.height,
      )

      const fmt = cropArea.format ?? 'jpeg'
      canvas.toBlob(
        blob => {
          if (!blob) return reject(new Error('Crop failed'))
          resolve(blob)
        },
        `image/${fmt}`,
        cropArea.quality ?? 0.92,
      )
      URL.revokeObjectURL(url)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

// ─── Convert format ────────────────────────────────────────────────────────
export async function convertImageFormat(
  file: File,
  targetFormat: ImageFormat,
  quality = 0.92,
  backgroundColor = '#ffffff',
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!

      // Fill background for JPEG (no transparency)
      if (targetFormat === 'jpeg') {
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      ctx.drawImage(img, 0, 0)

      canvas.toBlob(
        blob => {
          if (!blob) return reject(new Error('Conversion failed'))
          resolve(blob)
        },
        `image/${targetFormat}`,
        quality,
      )
      URL.revokeObjectURL(url)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

// ─── Get image dimensions ──────────────────────────────────────────────────
export async function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

// ─── Remove background (uses @imgly/background-removal) ───────────────────
export async function removeBackground(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<Blob> {
  const { removeBackground: removeBg } = await import('@imgly/background-removal')

  const result = await removeBg(file, {
    progress: (_key: string, current: number, total: number) => {
      onProgress?.(Math.round((current / total) * 100))
    },
    output: { format: 'image/png', quality: 0.9 },
  })

  return result
}

// ─── Strip EXIF metadata ───────────────────────────────────────────────────
export async function stripMetadata(file: File): Promise<Blob> {
  return convertImageFormat(file, 'jpeg', 0.95)
}

// ─── Bulk process ──────────────────────────────────────────────────────────
export async function bulkProcess(
  files: File[],
  operation: (file: File) => Promise<Blob>,
  onFileComplete?: (index: number, total: number) => void,
): Promise<Array<{ file: File; result: Blob | null; error?: string }>> {
  const results = []
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await operation(files[i])
      results.push({ file: files[i], result })
    } catch (err) {
      results.push({ file: files[i], result: null, error: String(err) })
    }
    onFileComplete?.(i + 1, files.length)
  }
  return results
}

// ─── Utils ─────────────────────────────────────────────────────────────────
export function createDownloadUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function getOutputFilename(
  original: string,
  suffix: string,
  extension?: string,
): string {
  const dotIdx = original.lastIndexOf('.')
  const base = dotIdx > 0 ? original.slice(0, dotIdx) : original
  const ext = extension ?? (dotIdx > 0 ? original.slice(dotIdx + 1) : 'png')
  return `${base}${suffix}.${ext}`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function getSavingsPercent(original: number, reduced: number): number {
  if (original === 0) return 0
  return Math.round(((original - reduced) / original) * 100)
                                }
        
