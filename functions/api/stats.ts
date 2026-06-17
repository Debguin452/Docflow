/**
 * GET /api/stats
 *
 * Returns aggregated tool usage counts.
 * Edge-cached for 5 minutes.
 * 1 KV read per cache miss.
 */

interface Env {
  DOCFLOW_KV: KVNamespace
}

type ToolStats = Record<string, number>

const STATS_KEY = 'stats:tools'
const CACHE_MAX_AGE = 300 // 5 minutes

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function onRequestGet(
  context: { request: Request; env: Env },
): Promise<Response> {
  const { env } = context

  let stats: ToolStats = {}
  let updatedAt = new Date().toISOString()

  try {
    const stored = await env.DOCFLOW_KV.getWithMetadata<ToolStats>(STATS_KEY, 'json')
    if (stored?.value && typeof stored.value === 'object') {
      stats = stored.value
    }
  } catch {
    // Return empty stats on failure
    stats = {}
  }

  // Sort by count descending for convenience
  const sorted = Object.fromEntries(
    Object.entries(stats).sort(([, a], [, b]) => b - a),
  )

  return new Response(
    JSON.stringify({ tools: sorted, updatedAt }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=60`,
        ...CORS_HEADERS,
      },
    },
  )
}
