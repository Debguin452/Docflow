import { Link } from 'react-router-dom'
import { Home, Wrench } from 'lucide-react'
import SEOHead from '../components/ui/SEOHead'

export default function NotFound() {
  return (
    <>
      <SEOHead
        title="Page Not Found — DocFlow"
        description="The page you're looking for doesn't exist. Browse DocFlow's free PDF and image tools."
        canonical="/404"
      />
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl font-black text-gray-100 select-none mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-500 text-sm mb-8 max-w-sm">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          <Link
            to="/tools"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Wrench className="w-4 h-4" />
            All Tools
          </Link>
        </div>
      </div>
    </>
  )
}
