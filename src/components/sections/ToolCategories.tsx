import { Link } from 'react-router-dom'
import { FileText, Image, Wrench, ArrowRight } from 'lucide-react'
import { TOOL_CATEGORIES } from '../../data/tools'

const CATEGORY_META = {
  pdf: {
    icon: FileText,
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    linkColor: 'text-blue-600 hover:text-blue-700',
    count: TOOL_CATEGORIES.pdf.tools.length,
  },
  image: {
    icon: Image,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    linkColor: 'text-emerald-600 hover:text-emerald-700',
    count: TOOL_CATEGORIES.image.tools.length,
  },
  utils: {
    icon: Wrench,
    color: 'bg-orange-50 text-orange-600 border-orange-100',
    linkColor: 'text-orange-600 hover:text-orange-700',
    count: TOOL_CATEGORIES.utils.tools.length,
  },
} as const

export default function ToolCategories() {
  return (
    <section className="py-14 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-2">
            Tool Categories
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Everything in one place
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {(Object.entries(TOOL_CATEGORIES) as [keyof typeof TOOL_CATEGORIES, typeof TOOL_CATEGORIES['pdf']][]).map(
            ([key, cat]) => {
              const meta = CATEGORY_META[key]
              const Icon = meta.icon
              const previewTools = cat.tools.slice(0, 5)

              return (
                <div
                  key={key}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl border ${meta.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{cat.label}</h3>
                      <p className="text-xs text-gray-500">{meta.count} tools</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                    {cat.description}
                  </p>

                  <ul className="space-y-1.5 mb-4">
                    {previewTools.map(tool => (
                      <li key={tool.id}>
                        <Link
                          to={`/${tool.slug}`}
                          className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                        >
                          → {tool.name}
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={`/tools#${key}`}
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold ${meta.linkColor} transition-colors`}
                  >
                    View all {cat.label}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )
            },
          )}
        </div>
      </div>
    </section>
  )
}
