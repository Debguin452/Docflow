import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Button from '../ui/Button'

export default function CTA() {
  return (
    <section className="py-16 bg-primary-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Start processing your files now
        </h2>
        <p className="text-lg text-primary-200 mb-8 max-w-xl mx-auto">
          Free, fast, and private. No account needed. Your files stay on your device.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/tools">
            <Button
              variant="secondary"
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
              className="bg-white text-primary-700 hover:bg-primary-50 border-transparent"
            >
              Browse All Tools
            </Button>
          </Link>
          <Link to="/pdf-compress">
            <Button
              size="lg"
              className="bg-primary-700 text-white border border-primary-500 hover:bg-primary-800"
            >
              Compress a PDF
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
