import { useState, useMemo, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import Fuse from 'fuse.js'
import SEOHead from '../components/ui/SEOHead'
import ToolCard from '../components/ui/ToolCard'
import { ALL_TOOLS, TOOL_CATEGORIES, type ToolMeta } from '../data/tools'

type Category = 'all' | 'pdf' | 'image' | 'utils'

const CAT_LABELS: Record<Category, string> = {
  all: 'All Tools',
  pdf: 'PDF Tools',
  image: 'Image Tools',
  utils: 'Utilities',
}

function ToolGroup({ id, label, tools }: { id: string; label: string; tools: ToolMeta[] }) {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h2 className="text-lg font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">
        {label}
        <span className="ml-2 text-sm font-normal text-gray-400">{tools.length} tools</span>
      </h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tools.map(tool => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  )
}

export default function Tools() {
  const location = useLocation()
  const hashCat = location.hash.replace('#', '') as Category
  const [activeCategory, setActiveCategory] = useState<Category>(
    ['pdf', 'image', 'utils'].includes(hashCat) ? hashCat : 'all',
  )
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (['pdf', 'image', 'utils'].includes(hashCat)) {
      setActiveCategory(hashCat)
    }
  }, [hashCat])

  const filtered = useMemo((): ToolMeta[] => {
    let tools = ALL_TOOLS
    if (activeCategory !== 'all') {
      tools = tools.filter(t => t.category === activeCategory)
    }
    if (!query.trim()) return tools
    const f = new Fuse(tools, {
      keys: [{ name: 'name', weight: 0.5 }, { name: 'tags', weight: 0.3 }, { name: 'shortDesc', weight: 0.2 }],
      threshold: 0.35,
    })
    return f.search(query).map(r => r.item)
  }, [activeCategory, query])

  const categories: Category[] = ['all', 'pdf', 'image', 'utils']

  return (
    <>
      <SEOHead
        title="All Document & Image Tools – DocFlow"
        description="Browse all 30+ free online tools for PDF processing, image conversion, QR codes, OCR and more. No signup. All browser-based."
        canonical="/tools"
        keywords="pdf tools, image tools, online utilities, document processing"
      />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Tools</h1>
          <p className="text-gray-500 text-sm mb-6">
            {ALL_TOOLS.length} free tools — all processing done in your browser.
          </p>

          <div className="relative max-w-md mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search tools…"
              className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              aria-label="Search tools"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-1 flex-wrap" role="tablist" aria-label="Tool categories">
            {categories.map(cat => (
              <button
                key={cat}
                role="tab"
                aria-selected={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  activeCategory === cat
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {CAT_LABELS[cat]}
                <span className="ml-1.5 text-[11px] opacity-70">
                  {cat === 'all'
                    ? ALL_TOOLS.length
                    : TOOL_CATEGORIES[cat as Exclude<Category, 'all'>].tools.length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {query ? (
          <div>
            <p className="text-sm text-gray-500 mb-5">
              {filtered.length === 0
                ? `No tools match "${query}"`
                : `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${query}"`}
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(tool => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {(activeCategory === 'all' || activeCategory === 'pdf') && (
              <ToolGroup id="pdf" label="PDF Tools" tools={TOOL_CATEGORIES.pdf.tools} />
            )}
            {(activeCategory === 'all' || activeCategory === 'image') && (
              <ToolGroup id="image" label="Image Tools" tools={TOOL_CATEGORIES.image.tools} />
            )}
            {(activeCategory === 'all' || activeCategory === 'utils') && (
              <ToolGroup id="utils" label="Utilities" tools={TOOL_CATEGORIES.utils.tools} />
            )}
          </>
        )}
      </div>
    </>
  )
}
