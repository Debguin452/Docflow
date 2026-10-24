import { Link } from 'react-router-dom'
import { ArrowRight, Clock } from 'lucide-react'
import { BLOG_POSTS } from '../../data/blog'

const FEATURED = BLOG_POSTS.filter(p => p.featured).slice(0, 3)

export default function BlogPreview() {
  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-1">
              From the Blog
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Guides &amp; tutorials
            </h2>
          </div>
          <Link
            to="/blog"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            All articles
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURED.map(post => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-primary-200 hover:shadow-sm transition-all duration-200 flex flex-col"
            >
              <div className="mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-primary-50 text-primary-600 rounded">
                  {post.category}
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-primary-700 transition-colors mb-2 line-clamp-2">
                {post.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed flex-1 line-clamp-3">
                {post.description}
              </p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{post.readingTime} min read</span>
                </div>
                <span className="text-xs text-primary-600 font-semibold group-hover:underline">
                  Read more →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
