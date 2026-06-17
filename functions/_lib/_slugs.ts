/**
 * Canonical set of all valid tool slugs.
 * Used by the analytics Function to reject unknown tool names.
 * Must stay in sync with src/data/tools.ts
 */
export const ALL_TOOL_SLUGS = new Set([
  // PDF
  'pdf-compress', 'merge-pdf', 'split-pdf', 'pdf-to-images',
  'images-to-pdf', 'pdf-rotate', 'pdf-reorder', 'pdf-protect',
  'pdf-unlock', 'pdf-watermark', 'pdf-extract', 'pdf-metadata', 'pdf-preview',
  // Image
  'compress-image', 'resize-image', 'crop-image', 'jpg-to-png',
  'png-to-jpg', 'webp-converter', 'background-remover',
  'image-converter', 'bulk-image',
  // Utils
  'qr-generator', 'qr-scanner', 'ocr', 'text-to-pdf', 'screenshot-to-pdf',
])
