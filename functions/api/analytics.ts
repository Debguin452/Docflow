/**
 * POST /api/analytics
 *
 * KV cost per request: exactly 1 read + 1 write.
 * KV cost when no tools used in session: 0 (client sends nothing).
 * KV cost for 1,000 concurrent users: still just 1 read + 1 write each.
 *
 * Accepts up to 25 events per batch (one full session's worth).
 * Ignores unknown tool slugs — prevents KV pollution.
 * Stores only aggregate integer counts — no PII, no timestamps.
 */

import { ALL_TOOL_SLUGS } from '../_lib/slugs'

interface Env {
  DOCFLOW_KV: KVNamespace
}

interface AnalyticsEvent {
  tool: string
  ts?: number
}

interface BatchPayload {
  events: AnalyticsEvent[]
}

type ToolStats = Record<string, number>

const STATS_KEY = 'stats:tools'
const MAX_EVENTS_PER_BATCH = 25

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: HEADERS })
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context

  // Parse and validate input
  let payload: BatchPayload
  try {
    payload = await request.json<BatchPayload>()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: HEADERS })
  }

  if (!Array.isArray(payload?.events) || payload.events.length === 0) {
    return new Response(JSON.stringify({ ok: true, processed: 0 }), { status: 200, headers: HEADERS })
  }

  // Clamp batch size and reject unknown slugs
  const validEvents = payload.events
    .slice(0, MAX_EVENTS_PER_BATCH)
    .filter(e => typeof e.tool === 'string' && ALL_TOOL_SLUGS.has(e.tool))

  if (validEvents.length === 0) {
    return new Response(JSON.stringify({ ok: true, processed: 0 }), { status: 200, headers: HEADERS })
  }

  // ── 1 KV read ──────────────────────────────────────────────────────────
  let stats: ToolStats = {}
  try {
    const stored = await env.DOCFLOW_KV.get<ToolStats>(STATS_KEY, 'json')
    if (stored && typeof stored === 'object') stats = stored
  } catch {
    // Read failed — still proceed; counts may be slightly inaccurate but won't crash
  }

  // Increment in memory (no extra KV ops)
  for (const event of validEvents) {
    stats[event.tool] = (stats[event.tool] ?? 0) + 1
  }

  // ── 1 KV write ─────────────────────────────────────────────────────────
  try {
    await env.DOCFLOW_KV.put(STATS_KEY, JSON.stringify(stats))
  } catch {
    // Write failed — return ok anyway; analytics is non-critical
    return new Response(JSON.stringify({ ok: true, processed: validEvents.length, warning: 'kv_write_failed' }), { status: 200, headers: HEADERS })
  }

  return new Response(JSON.stringify({ ok: true, processed: validEvents.length }), { status: 200, headers: HEADERS })
}
