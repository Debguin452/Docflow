import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ArrowRight } from 'lucide-react'
import SEOHead from '../components/ui/SEOHead'
import Breadcrumb from '../components/ui/Breadcrumb'
import { BLOG_POSTS, BLOG_CATEGORIES, getBlogPostsByCategory, type BlogCategory } from '../data/blog'

const CAT_LABEL: Record<BlogCategory, string> = {
  All: 'All',
  tutorials: 'Tutorials',
  comparisons: 'Comparisons',
  guides: 'Guides',
  tips: 'Tips',
}

export default function Blog() {
  const [category, setCategory] = useState<BlogCategory>('All')
  const posts = getBlogPostsByCategory(category)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'DocFlow Blog',
    description: 'Guides and tutorials for PDF, image, and document processing.',
    url: 'https://docflow.pages.dev/blog',
    blogPost: BLOG_POSTS.map(p => ({
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.description,
      datePublished: p.publishedAt,
      url: `https://docflow.pages.dev/blog/${p.slug}`,
    })),
  }

  return (
    <>
      <SEOHead
        title="Blog — DocFlow PDF & Image Processing Guides"
        description="Free guides and tutorials on PDF compression, image conversion, background removal, OCR, and more. Written by the DocFlow team."
        canonical="/blog"
        schema={schema}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Blog' }]} />

        <div className="mt-8 mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Blog</h1>
          <p className="text-gray-500">Guides, tutorials, and comparisons for document and image processing.</p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-8" role="tablist" aria-label="Blog categories">
          {BLOG_CATEGORIES.map(cat => (
            <button
              key={cat}
              role="tab"
              aria-selected={category === cat}
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                category === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {CAT_LABEL[cat]}
            </button>
          ))}
        </div>

        {/* Post grid */}
        {posts.length === 0 ? (
          <p className="text-gray-400 text-sm">No posts in this category yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {posts.map(post => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-primary-200 hover:shadow-sm transition-all duration-200 flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-primary-50 text-primary-600 rounded">
                    {CAT_LABEL[post.category]}
                  </span>
                  {post.featured && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-amber-50 text-amber-600 rounded">
                      Featured
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-gray-900 leading-snug group-hover:text-primary-700 transition-colors mb-2">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed flex-1 line-clamp-3">
                  {post.description}
                </p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readingTime} min read
                    </div>
                    <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <span className="text-xs font-semibold text-primary-600 inline-flex items-center gap-1 group-hover:underline">
                    Read <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
