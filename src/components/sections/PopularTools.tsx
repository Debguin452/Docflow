import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ToolCard from '../ui/ToolCard'
import { POPULAR_TOOLS } from '../../data/tools'

export default function PopularTools() {
  return (
    <section className="py-14 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-1">
              Most Used
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Popular tools</h2>
          </div>
          <Link
            to="/tools"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            View all tools
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {POPULAR_TOOLS.map(tool => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        <div className="mt-6 sm:hidden text-center">
          <Link
            to="/tools"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            View all 30+ tools
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
