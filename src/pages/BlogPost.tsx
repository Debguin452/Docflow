import { useParams, Link, Navigate } from 'react-router-dom'
import { Clock, ArrowLeft, ArrowRight } from 'lucide-react'
import SEOHead from '../components/ui/SEOHead'
import Breadcrumb from '../components/ui/Breadcrumb'
import { getBlogPost, getRelatedBlogPosts } from '../data/blog'

/** Minimal markdown renderer: headings, bold, inline code, lists, paragraphs, tables */
function renderContent(content: string): React.ReactNode[] {
  const lines = content.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0
  let key = 0

  const nextKey = () => ++key

  // Inline: **bold**, `code`
  function renderInline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = []
    let remaining = text
    let k = 0
    while (remaining.length > 0) {
      const boldIdx = remaining.indexOf('**')
      const codeIdx = remaining.indexOf('`')
      if (boldIdx === -1 && codeIdx === -1) {
        parts.push(remaining)
        break
      }
      if ((boldIdx !== -1 && (codeIdx === -1 || boldIdx < codeIdx))) {
        if (boldIdx > 0) parts.push(remaining.slice(0, boldIdx))
        const end = remaining.indexOf('**', boldIdx + 2)
        if (end === -1) { parts.push(remaining); break }
        parts.push(<strong key={k++} className="font-semibold text-gray-900">{remaining.slice(boldIdx + 2, end)}</strong>)
        remaining = remaining.slice(end + 2)
      } else {
        if (codeIdx > 0) parts.push(remaining.slice(0, codeIdx))
        const end = remaining.indexOf('`', codeIdx + 1)
        if (end === -1) { parts.push(remaining); break }
        parts.push(<code key={k++} className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-[0.8em] font-mono">{remaining.slice(codeIdx + 1, end)}</code>)
        remaining = remaining.slice(end + 1)
      }
    }
    return parts.length === 1 ? parts[0] : <>{parts}</>
  }

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) { i++; continue }

    // Heading
    if (line.startsWith('## ')) {
      nodes.push(<h2 key={nextKey()} className="text-xl font-bold text-gray-900 mt-8 mb-3">{line.slice(3)}</h2>)
      i++; continue
    }
    if (line.startsWith('### ')) {
      nodes.push(<h3 key={nextKey()} className="text-base font-bold text-gray-900 mt-6 mb-2">{line.slice(4)}</h3>)
      i++; continue
    }

    // Table
    if (line.startsWith('|')) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        if (!lines[i].includes('---')) {
          rows.push(lines[i].split('|').filter(c => c.trim()).map(c => c.trim()))
        }
        i++
      }
      nodes.push(
        <div key={nextKey()} className="overflow-x-auto my-5">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {rows[0]?.map((cell, ci) => (
                  <th key={ci} className="px-3 py-2 text-left font-semibold text-gray-700 text-xs uppercase tracking-wide whitespace-nowrap">{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, ri) => (
                <tr key={ri} className="border-b border-gray-100 hover:bg-gray-50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-gray-600">{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }

    // Unordered list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2))
        i++
      }
      nodes.push(
        <ul key={nextKey()} className="my-3 space-y-1.5 pl-4">
          {items.map((item, ii) => (
            <li key={ii} className="text-sm text-gray-600 leading-relaxed list-disc ml-2">{renderInline(item)}</li>
          ))}
        </ul>
      )
      continue
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      nodes.push(
        <ol key={nextKey()} className="my-3 space-y-1.5 pl-4">
          {items.map((item, ii) => (
            <li key={ii} className="text-sm text-gray-600 leading-relaxed list-decimal ml-2">{renderInline(item)}</li>
          ))}
        </ol>
      )
      continue
    }

    // Paragraph
    nodes.push(
      <p key={nextKey()} className="text-sm text-gray-600 leading-relaxed mb-3">
        {renderInline(line)}
      </p>
    )
    i++
  }

  return nodes
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? getBlogPost(slug) : undefined

  if (!post) return <Navigate to="/blog" replace />

  const related = getRelatedBlogPosts(post)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: { '@type': 'Organization', name: post.author },
    publisher: { '@type': 'Organization', name: 'DocFlow' },
    url: `https://docflow.pages.dev/blog/${post.slug}`,
    keywords: post.tags.join(', '),
  }

  return (
    <>
      <SEOHead
        title={post.title}
        description={post.description}
        canonical={`/blog/${post.slug}`}
        keywords={post.tags.join(', ')}
        schema={schema}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb
          crumbs={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: post.title },
          ]}
        />

        <article className="mt-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-primary-50 text-primary-600 rounded">
                {post.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {post.readingTime} min read
              </span>
              <span className="text-xs text-gray-400">
                {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">{post.title}</h1>
            <p className="text-base text-gray-500 leading-relaxed">{post.description}</p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-8 pb-6 border-b border-gray-100">
            {post.tags.map(tag => (
              <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                #{tag}
              </span>
            ))}
          </div>

          {/* Content */}
          <div className="blog-content">
            {renderContent(post.content)}
          </div>
        </article>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-100">
            <h2 className="text-base font-bold text-gray-900 mb-4">Related articles</h2>
            <div className="space-y-3">
              {related.map(rp => (
                <Link
                  key={rp.slug}
                  to={`/blog/${rp.slug}`}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-200 hover:shadow-sm transition-all group"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-700 transition-colors">{rp.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{rp.readingTime} min read</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 shrink-0 ml-4 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back */}
        <div className="mt-8">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </div>
    </>
  )
}
