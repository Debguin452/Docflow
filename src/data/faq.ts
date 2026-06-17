import type { FAQItem } from '../types'

export const HOMEPAGE_FAQ: FAQItem[] = [
  {
    question: 'Are my files safe and private?',
    answer: 'Absolutely. All file processing happens directly in your browser using JavaScript. Your files are never uploaded to our servers. We have no access to your documents or images.',
  },
  {
    question: 'Do I need to create an account?',
    answer: 'No account is required for any free tool. Simply visit the tool page, upload your file, and download the result. Premium features like batch processing and cloud storage require a free account.',
  },
  {
    question: 'Is DocFlow really free?',
    answer: 'Yes. All core tools are completely free with no usage limits. We offer optional premium features for power users who need advanced capabilities or priority processing.',
  },
  {
    question: 'What file size limits apply?',
    answer: 'Free users can process files up to 50MB per file. PDF merging supports up to 20 files per operation. Premium users have no limits.',
  },
  {
    question: 'What browsers are supported?',
    answer: 'DocFlow works in any modern browser — Chrome, Firefox, Safari, and Edge. We recommend Chrome for best performance on large files.',
  },
  {
    question: 'How long are files stored?',
    answer: 'Since all processing is done locally in your browser, no files are stored on our servers at all. Downloaded files are yours — we have no copies.',
  },
]

export const PDF_COMPRESS_FAQ: FAQItem[] = [
  {
    question: 'How much can I compress a PDF?',
    answer: 'Compression rates vary depending on content. PDFs with many images can be reduced by 60-90%. Text-heavy PDFs typically compress by 20-50%.',
  },
  {
    question: 'Will compression reduce PDF quality?',
    answer: 'Our compression optimizes internal structures and downsizes embedded images intelligently. For most documents, quality loss is imperceptible. You can choose between low, medium, and high compression to balance size vs quality.',
  },
  {
    question: 'Can I compress password-protected PDFs?',
    answer: 'You need to unlock a PDF before compressing it. Use our PDF Unlock tool first, then compress.',
  },
]

export const IMAGE_COMPRESS_FAQ: FAQItem[] = [
  {
    question: 'What image formats can I compress?',
    answer: 'You can compress JPG, JPEG, PNG, WEBP, and GIF files. Each format uses the most appropriate compression algorithm.',
  },
  {
    question: 'What is the best compression level?',
    answer: 'For web images, Medium (75% quality) is usually ideal — files are 60-80% smaller with no visible loss. For print materials, use Low compression for maximum quality.',
  },
  {
    question: 'Can I compress multiple images at once?',
    answer: 'Yes. You can drag and drop multiple images for batch processing. All files are compressed simultaneously in your browser.',
  },
]
