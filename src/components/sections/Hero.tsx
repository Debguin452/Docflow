import { Shield, ArrowRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button'

const STATS = [
  { value: '30+', label: 'Free tools' },
  { value: '100%', label: 'Browser-based' },
  { value: '0', label: 'Files uploaded' },
  { value: '50MB', label: 'Max file size' },
]

export default function Hero() {
  return (
    <section className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-14">
        <div className="max-w-3xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold mb-6 border border-primary-100">
            <Shield className="w-3 h-3" />
            <span>All processing done locally — zero uploads</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-gray-900 leading-[1.1] tracking-tight mb-5">
            Every document tool
            <br />
            <span className="text-primary-600">you'll ever need</span>
          </h1>

          {/* Sub */}
          <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-xl mx-auto">
            Compress, merge, split, convert — PDFs and images, instantly in your browser.
            No sign-up. No uploads. No nonsense.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link to="/tools">
              <Button size="lg" variant="primary" icon={<ArrowRight className="w-4 h-4" />}>
                Browse All Tools
              </Button>
            </Link>
            <Link to="/pdf-compress">
              <Button size="lg" variant="secondary">
                Compress a PDF
              </Button>
            </Link>
          </div>

          {/* Trust stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {STATS.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tool strip */}
      <div className="border-t border-gray-100 bg-gray-50 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {[
              'Compress PDF', 'Merge PDF', 'Split PDF', 'PDF to Images',
              'Remove Background', 'Compress Image', 'QR Generator', 'OCR',
            ].map(tool => (
              <span key={tool} className="text-xs text-gray-500 flex items-center gap-1">
                <Star className="w-2.5 h-2.5 text-primary-500 fill-primary-500" />
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
