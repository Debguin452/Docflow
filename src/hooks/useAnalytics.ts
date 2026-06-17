import { useCallback, useEffect } from 'react'
import { enqueueAnalyticsEvent, flushAnalyticsQueue } from '../lib/idb'

declare global {
  interface ImportMeta {
    readonly env: Record<string, string | undefined>
  }
}

const ENABLED = import.meta.env['VITE_ENABLE_ANALYTICS'] !== 'false'

/**
 * Analytics flush strategy — absolute minimum KV operations:
 *
 *   Client-side  → sessionStorage queue (zero network)
 *   On tab HIDE  → single fetch/sendBeacon (1 HTTP POST)
 *   Server-side  → 1 KV read + 1 KV write (regardless of events in batch)
 *
 * Result: 1 read + 1 write per user session, only when tools were actually used.
 * Sessions with no tool usage → 0 KV operations.
 */

function flush() {
  const events = flushAnalyticsQueue()
  if (!events.length) return // zero events → zero KV ops

  const body = JSON.stringify({ events })
  const url = '/api/analytics'

  // sendBeacon is fire-and-forget and survives page unload reliably.
  // Falls back to fetch if sendBeacon is unavailable.
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
  } else {
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
      .catch(() => { /* silently fail — analytics must never break UI */ })
  }
}

export function useAnalytics() {
  useEffect(() => {
    if (!ENABLED) return

    const onVisibility = () => {
      // Only flush when tab becomes hidden — not when it becomes visible.
      // This prevents a double-flush on tab switch (hide → show).
      if (document.visibilityState === 'hidden') flush()
    }

    // pagehide fires reliably on mobile Safari when the page is closed.
    // visibilitychange covers desktop tab switches and minimizes.
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
    }
  }, [])

  const trackToolUse = useCallback((toolSlug: string) => {
    if (!ENABLED) return
    enqueueAnalyticsEvent(toolSlug)
  }, [])

  return { trackToolUse }
}
