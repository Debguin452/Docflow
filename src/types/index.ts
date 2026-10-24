export type ToolCategory = 'pdf' | 'image' | 'utils'

export interface ToolMeta {
  id: string
  name: string
  slug: string
  description: string
  shortDesc: string
  icon: string
  category: ToolCategory
  popular?: boolean
  new?: boolean
  tags?: string[]
  relatedTools?: string[]
  faq?: FAQItem[]
}

export interface FAQItem {
  question: string
  answer: string
}

export interface ProcessedFile {
  name: string
  originalSize: number
  processedSize?: number
  url: string
  blob?: Blob
  type: string
}

export type ProcessStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

export interface ProcessState {
  status: ProcessStatus
  progress: number
  error?: string
  files: ProcessedFile[]
}

export interface UploadedFile {
  file: File
  id: string
  preview?: string
}

export type CompressionLevel = 'low' | 'medium' | 'high' | 'maximum'

export interface PDFPageInfo {
  pageNumber: number
  width: number
  height: number
  rotation: number
}

export interface ImageConvertOptions {
  format: 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp'
  quality: number
  width?: number
  height?: number
  maintainAspectRatio?: boolean
}

export interface SEOProps {
  title: string
  description: string
  canonical?: string
  ogType?: string
  keywords?: string
  schema?: object
}
