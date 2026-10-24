// Single registry of lazy route loaders, shared by <App/> (to render routes)
// and by prefetch helpers (to warm chunks on hover/focus/idle).
// Dynamic imports are cached by the module system, so a prefetch and the later
// real navigation resolve to the very same promise: zero duplicate downloads.
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

type Loader = () => Promise<{ default: ComponentType }>

export const PAGE_LOADERS = {
  home: () => import('../pages/Home'),
  tools: () => import('../pages/Tools'),
  about: () => import('../pages/About'),
  privacy: () => import('../pages/Privacy'),
  terms: () => import('../pages/Terms'),
  blog: () => import('../pages/Blog'),
  blogPost: () => import('../pages/BlogPost'),
  notFound: () => import('../pages/NotFound'),
} satisfies Record<string, Loader>

/** Keyed by tool slug (the route path is `/${slug}`). */
export const TOOL_LOADERS: Record<string, Loader> = {
  // PDF
  'pdf-compress': () => import('../components/tools/pdf/PDFCompress'),
  'merge-pdf': () => import('../components/tools/pdf/PDFMerge'),
  'split-pdf': () => import('../components/tools/pdf/PDFSplit'),
  'pdf-to-images': () => import('../components/tools/pdf/PDFToImages'),
  'images-to-pdf': () => import('../components/tools/pdf/ImagesToPDF'),
  'pdf-rotate': () => import('../components/tools/pdf/PDFRotate'),
  'pdf-reorder': () => import('../components/tools/pdf/PDFReorder'),
  'pdf-protect': () => import('../components/tools/pdf/PDFProtect'),
  'pdf-unlock': () => import('../components/tools/pdf/PDFUnlock'),
  'pdf-watermark': () => import('../components/tools/pdf/PDFWatermark'),
  'pdf-extract': () => import('../components/tools/pdf/PDFExtract'),
  'pdf-metadata': () => import('../components/tools/pdf/PDFMetadata'),
  'pdf-preview': () => import('../components/tools/pdf/PDFPreview'),
  // Image
  'compress-image': () => import('../components/tools/image/ImageCompress'),
  'resize-image': () => import('../components/tools/image/ResizeImage'),
  'crop-image': () => import('../components/tools/image/CropImage'),
  'jpg-to-png': () => import('../components/tools/image/JPGtoPNG'),
  'png-to-jpg': () => import('../components/tools/image/PNGtoJPG'),
  'webp-converter': () => import('../components/tools/image/WEBPConverter'),
  'background-remover': () => import('../components/tools/image/BackgroundRemover'),
  'image-converter': () => import('../components/tools/image/ImageConverter'),
  'bulk-image': () => import('../components/tools/image/BulkImage'),
  // Utilities
  'qr-generator': () => import('../components/tools/utils/QRGenerator'),
  'qr-scanner': () => import('../components/tools/utils/QRScanner'),
  'ocr': () => import('../components/tools/utils/OCRTool'),
  'text-to-pdf': () => import('../components/tools/utils/TextToPDF'),
  'screenshot-to-pdf': () => import('../components/tools/utils/ScreenshotToPDF'),
}

// Core-page paths that can be prefetched by href as well
const PAGE_BY_PATH: Record<string, Loader> = {
  '/': PAGE_LOADERS.home,
  '/tools': PAGE_LOADERS.tools,
  '/about': PAGE_LOADERS.about,
  '/privacy': PAGE_LOADERS.privacy,
  '/terms': PAGE_LOADERS.terms,
  '/blog': PAGE_LOADERS.blog,
}

export const LAZY_PAGES = {
  Home: lazy(PAGE_LOADERS.home),
  Tools: lazy(PAGE_LOADERS.tools),
  About: lazy(PAGE_LOADERS.about),
  Privacy: lazy(PAGE_LOADERS.privacy),
  Terms: lazy(PAGE_LOADERS.terms),
  Blog: lazy(PAGE_LOADERS.blog),
  BlogPost: lazy(PAGE_LOADERS.blogPost),
  NotFound: lazy(PAGE_LOADERS.notFound),
}

export const LAZY_TOOLS: Record<string, LazyExoticComponent<ComponentType>> = Object.fromEntries(
  Object.entries(TOOL_LOADERS).map(([slug, loader]) => [slug, lazy(loader)]),
)

// ─── Prefetching ───────────────────────────────────────────────────────────
const warmed = new Set<string>()

/** Warm the chunk for a path like "/merge-pdf" or "/tools#pdf". Safe to call repeatedly. */
export function prefetchPath(href: string): void {
  const path = href.split('#')[0].split('?')[0] || '/'
  if (warmed.has(path)) return
  const loader = PAGE_BY_PATH[path] ?? TOOL_LOADERS[path.replace(/^\//, '')]
  if (!loader) return
  warmed.add(path)
  loader().catch(() => warmed.delete(path)) // allow retry if the network failed
}

/** Props to spread on a <Link>: prefetch when the user shows intent. */
export function prefetchProps(href: string) {
  const warm = () => prefetchPath(href)
  return { onMouseEnter: warm, onFocus: warm, onTouchStart: warm } as const
}

function connectionIsFast(): boolean {
  const c = (navigator as unknown as {
    connection?: { saveData?: boolean; effectiveType?: string }
  }).connection
  if (!c) return true
  if (c.saveData) return false
  return !c.effectiveType || c.effectiveType === '4g'
}

/** After the page is idle, quietly warm the most-used tool chunks. */
export function prefetchWhenIdle(slugs: string[]): void {
  if (typeof window === 'undefined' || !connectionIsFast()) return
  const run = () => slugs.forEach(s => prefetchPath(`/${s}`))
  const ric = (window as unknown as {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void
  }).requestIdleCallback
  if (ric) ric(run, { timeout: 4000 })
  else setTimeout(run, 2500)
}
