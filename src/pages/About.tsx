import { Shield, Zap, Globe, Lock } from 'lucide-react'
import SEOHead from '../components/ui/SEOHead'
import Breadcrumb from '../components/ui/Breadcrumb'

const VALUES = [
  {
    icon: Shield,
    title: 'Privacy by design',
    body: 'Every tool runs entirely in your browser. We have no servers that receive, store, or process your files. Your documents never leave your device — technically impossible for us to access them.',
  },
  {
    icon: Zap,
    title: 'Performance first',
    body: 'Built on Cloudflare\'s global edge network. Static assets are cached at hundreds of locations worldwide, delivering sub-second load times regardless of where you are.',
  },
  {
    icon: Globe,
    title: 'Accessible everywhere',
    body: 'No installation. No account. No subscription. Open a browser, pick a tool, and process your file. It takes three clicks or fewer to complete any task.',
  },
  {
    icon: Lock,
    title: 'Open and transparent',
    body: 'Our processing libraries (pdf-lib, Tesseract.js, browser-image-compression) are open-source and auditable. The code that runs on your device is public.',
  },
]

export default function About() {
  return (
    <>
      <SEOHead
        title="About DocFlow — Privacy-First Document Tools"
        description="DocFlow provides free, browser-based PDF and image processing tools. All processing is local — your files never leave your device. Learn about our mission and technology."
        canonical="/about"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'About' }]} />

        <div className="mt-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">About DocFlow</h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-3">
            DocFlow is a free, open-source document and image processing toolkit that runs entirely in your browser. We built it because existing tools either charge for basic operations, require uploading sensitive documents to unknown servers, or are cluttered with distracting interfaces.
          </p>
          <p className="text-base text-gray-600 leading-relaxed">
            The philosophy is simple: every tool should work without an account, every file should stay on your device, and every interface should be fast enough that you don't notice it.
          </p>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Our values</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {VALUES.map(v => {
              const Icon = v.icon
              return (
                <div key={v.title} className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="w-9 h-9 flex items-center justify-center bg-primary-50 text-primary-600 rounded-lg mb-3">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{v.body}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Technology</h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>DocFlow is built with React, TypeScript, and Vite, deployed on Cloudflare Pages. The processing stack uses:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>pdf-lib</strong> — PDF creation, merging, splitting, rotating, watermarking, and metadata editing</li>
              <li><strong>PDF.js (pdfjs-dist)</strong> — Rendering PDF pages to canvas for image export and preview</li>
              <li><strong>browser-image-compression</strong> — Client-side image compression via Canvas API</li>
              <li><strong>Tesseract.js</strong> — WebAssembly OCR engine supporting 100+ languages</li>
              <li><strong>@imgly/background-removal</strong> — AI background removal running entirely in WebAssembly</li>
              <li><strong>qrcode &amp; jsqr</strong> — QR code generation and scanning via Canvas</li>
            </ul>
            <p>No file ever reaches a server. The Cloudflare Functions only handle analytics aggregation (tool usage counts, no content) and sitemap generation.</p>
          </div>
        </div>

        <div className="mt-12 bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-2">Contact</h2>
          <p className="text-sm text-gray-600">
            For bug reports, feature requests, or business inquiries, open an issue on GitHub or email{' '}
            <a href="mailto:hello@docflow.pages.dev" className="text-primary-600 hover:underline">
              hello@docflow.pages.dev
            </a>
            .
          </p>
        </div>
      </div>
    </>
  )
}
