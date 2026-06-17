import { Link } from 'react-router-dom'
import { Zap, Shield, Globe } from 'lucide-react'

const FOOTER_LINKS = {
  'PDF Tools': [
    { label: 'Compress PDF', href: '/pdf-compress' },
    { label: 'Merge PDF', href: '/merge-pdf' },
    { label: 'Split PDF', href: '/split-pdf' },
    { label: 'PDF to Images', href: '/pdf-to-images' },
    { label: 'Protect PDF', href: '/pdf-protect' },
    { label: 'Rotate PDF', href: '/pdf-rotate' },
  ],
  'Image Tools': [
    { label: 'Compress Image', href: '/compress-image' },
    { label: 'Resize Image', href: '/resize-image' },
    { label: 'Remove Background', href: '/background-remover' },
    { label: 'JPG to PNG', href: '/jpg-to-png' },
    { label: 'PNG to JPG', href: '/png-to-jpg' },
    { label: 'Image Converter', href: '/image-converter' },
  ],
  'Utilities': [
    { label: 'QR Generator', href: '/qr-generator' },
    { label: 'QR Scanner', href: '/qr-scanner' },
    { label: 'OCR – Text from Image', href: '/ocr' },
    { label: 'Text to PDF', href: '/text-to-pdf' },
  ],
  'Company': [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mb-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 flex items-center justify-center bg-primary-600 rounded-lg">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold text-gray-900">DocFlow</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Professional document and image tools. Fast, free, and private. Files never leave your browser.
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Files processed locally</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Globe className="w-3.5 h-3.5 text-primary-500" />
                <span>Served from Cloudflare edge</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} DocFlow. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <Link to="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
            <Link to="/sitemap.xml" className="hover:text-gray-600 transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
