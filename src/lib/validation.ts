export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB

export const MIME_TYPES = {
  pdf: ['application/pdf'],
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'],
  jpeg: ['image/jpeg', 'image/jpg'],
  png: ['image/png'],
  webp: ['image/webp'],
} as const

export const ACCEPT = {
  pdf: { 'application/pdf': ['.pdf'] },
  image: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif'],
    'image/bmp': ['.bmp'],
  },
  jpeg: { 'image/jpeg': ['.jpg', '.jpeg'] },
  png: { 'image/png': ['.png'] },
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateFile(
  file: File,
  options: {
    allowedTypes?: string[]
    maxSizeBytes?: number
  } = {},
): ValidationResult {
  const { allowedTypes, maxSizeBytes = MAX_FILE_SIZE } = options

  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' }
  }

  if (file.size > maxSizeBytes) {
    const mb = (maxSizeBytes / 1024 / 1024).toFixed(0)
    return { valid: false, error: `File exceeds maximum size of ${mb}MB.` }
  }

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type "${file.type}". Expected: ${allowedTypes.join(', ')}.`,
    }
  }

  // Check for dangerous file names
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.js', '.php']
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
  if (dangerousExtensions.includes(ext)) {
    return { valid: false, error: 'File type not permitted.' }
  }

  return { valid: true }
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/^\.+/, '')
    .trim()
    .slice(0, 255) || 'file'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function getSavingsPercent(original: number, reduced: number): number {
  if (original === 0 || reduced >= original) return 0
  return Math.round(((original - reduced) / original) * 100)
}

export function getFileExtension(filename: string): string {
  const idx = filename.lastIndexOf('.')
  return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : ''
}

export function replaceExtension(filename: string, newExt: string): string {
  const idx = filename.lastIndexOf('.')
  const base = idx >= 0 ? filename.slice(0, idx) : filename
  return `${base}.${newExt}`
}
