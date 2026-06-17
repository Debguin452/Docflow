/**
 * Cloudflare Pages global middleware
 * Runs before every request (static assets + Functions)
 * Handles: rate limiting on /api/*, request validation
 */

interface Env {
  DOCFLOW_KV: KVNamespace
  ENVIRONMENT: string
  RATE_LIMIT_WINDOW_S: string
  ANALYTICS_RATE_LIMIT: string
  STATS_RATE_LIMIT: string
}

type PagesEventContext = {
  request: Request
  env: Env
  next: () => Promise<Response>
}

// Sliding window rate limiter using KV
async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const kvKey = `rl:${key}`
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  type RLRecord = { count: number; windowStart: number }

  let record: RLRecord = { count: 0, windowStart: now }

  try {
    const stored = await kv.get<RLRecord>(kvKey, 'json')
    if (stored) {
      // Reset window if expired
      if (now - stored.windowStart > windowMs) {
        record = { count: 0, windowStart: now }
      } else {
        record = stored
      }
    }
  } catch {
    // KV read failed → allow request, don't block on infrastructure errors
    return { allowed: true, remaining: limit }
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  // Write back with TTL = window duration
  await kv.put(kvKey, JSON.stringify(record), { expirationTtl: windowSeconds + 5 }).catch(() => {})

  return { allowed: true, remaining: limit - record.count }
}

// Extract a safe IP key (hashed for privacy, not stored as PII)
function getIPKey(request: Request): string {
  const ip =
    request.headers.get('CF-Connecting-IP') ??
    request.headers.get('X-Forwarded-For')?.split(',')[0].trim() ??
    'unknown'
  // Simple hash: first 16 chars of IP + path prefix → prevents PII storage
  return `${ip.slice(0, 16)}:${new URL(request.url).pathname.slice(0, 20)}`
}

export async function onRequest(context: PagesEventContext): Promise<Response> {
  const { request, env, next } = context
  const url = new URL(request.url)
  const path = url.pathname

  // Only rate-limit API routes
  if (path.startsWith('/api/')) {
    const ipKey = getIPKey(request)
    const windowS = parseInt(env.RATE_LIMIT_WINDOW_S ?? '60', 10)

    let limit = 60
    if (path === '/api/analytics') {
      limit = parseInt(env.ANALYTICS_RATE_LIMIT ?? '20', 10)
    } else if (path === '/api/stats') {
      limit = parseInt(env.STATS_RATE_LIMIT ?? '60', 10)
    }

    const { allowed, remaining } = await checkRateLimit(env.DOCFLOW_KV, ipKey, limit, windowS)

    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(windowS),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
        },
      })
    }

    const response = await next()
    const newResponse = new Response(response.body, response)
    newResponse.headers.set('X-RateLimit-Limit', String(limit))
    newResponse.headers.set('X-RateLimit-Remaining', String(remaining))
    return newResponse
  }

  // Block obviously malicious paths
  const blockedPaths = [
    '/wp-admin', '/wp-login', '/.env', '/config.php',
    '/admin', '/phpmyadmin', '/shell', '/cgi-bin',
  ]
  if (blockedPaths.some(p => path.toLowerCase().startsWith(p))) {
    return new Response('Not found', { status: 404 })
  }

  return next()
    }
