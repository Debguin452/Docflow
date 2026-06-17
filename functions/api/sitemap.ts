/**
 * GET /api/sitemap
 *
 * Dynamically generates sitemap.xml from static data.
 * Cached in KV for 1 hour (1 read per hour after first generation).
 * Also served directly at /sitemap.xml via _redirects.
 */

interface Env {
  DOCFLOW_KV: KVNamespace
  SITE_URL: string
  ENVIRONMENT: string
}

const SITEMAP_CACHE_KEY = 'sitemap:cache'
const CACHE_TTL = 3600 // 1 hour

// Static data — duplicated here so the Function doesn't import from src/
// This avoids bundling issues with Cloudflare Workers
const TOOL_SLUGS = [
  'pdf-compress', 'merge-pdf', 'split-pdf', 'pdf-to-images', 'images-to-pdf',
  'pdf-rotate', 'pdf-reorder', 'pdf-protect', 'pdf-unlock', 'pdf-watermark',
  'pdf-extract', 'pdf-metadata', 'pdf-preview',
  'compress-image', 'resize-image', 'crop-image', 'jpg-to-png', 'png-to-jpg',
  'webp-converter', 'background-remover', 'image-converter', 'bulk-image',
  'qr-generator', 'qr-scanner', 'ocr', 'text-to-pdf', 'screenshot-to-pdf',
]

const BLOG_SLUGS = [
  'how-to-compress-pdf-without-losing-quality',
  'webp-vs-jpg-vs-png',
  'how-to-remove-image-backgrounds',
  'merge-pdf-files-complete-guide',
  'ocr-extract-text-from-images',
]

const STATIC_PAGES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/tools', changefreq: 'weekly', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.4' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/blog', changefreq: 'weekly', priority: '0.7' },
]

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildSitemap(siteUrl: string): string {
  const today = new Date().toISOString().slice(0, 10)
  const base = siteUrl.replace(/\/$/, '')

  const urls: string[] = []

  const addUrl = (path: string, changefreq: string, priority: string, lastmod = today) => {
    urls.push(`  <url>
    <loc>${escapeXml(base + path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`)
  }

  // Static pages
  for (const page of STATIC_PAGES) {
    addUrl(page.path, page.changefreq, page.priority)
  }

  // Tool pages
  for (const slug of TOOL_SLUGS) {
    addUrl(`/${slug}`, 'monthly', '0.8')
  }

  // Blog posts
  for (const slug of BLOG_SLUGS) {
    addUrl(`/blog/${slug}`, 'monthly', '0.6')
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.join('\n')}
</urlset>`
}

export async function onRequestGet(
  context: { request: Request; env: Env },
): Promise<Response> {
  const { env } = context
  const siteUrl = env.SITE_URL ?? 'https://docflow.pages.dev'

  // Try cache first (1 KV read per hour)
  try {
    const cached = await env.DOCFLOW_KV.get(SITEMAP_CACHE_KEY, 'text')
    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': `public, max-age=${CACHE_TTL}`,
          'X-Cache': 'HIT',
        },
      })
    }
  } catch {
    // Fall through to generation
  }

  // Generate
  const xml = buildSitemap(siteUrl)

  // Cache in KV (1 KV write per hour max)
  try {
    await env.DOCFLOW_KV.put(SITEMAP_CACHE_KEY, xml, { expirationTtl: CACHE_TTL })
  } catch {
    // Non-fatal: still return the XML
  }

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, max-age=${CACHE_TTL}`,
      'X-Cache': 'MISS',
    },
  })
}
