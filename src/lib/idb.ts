const DB_NAME = 'docflow'
const DB_VERSION = 1
const RESULT_TTL_MS = 60 * 60 * 1000

let _db: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('wasm-cache')) db.createObjectStore('wasm-cache')
      if (!db.objectStoreNames.contains('results')) db.createObjectStore('results')
    }
    req.onsuccess = (e) => { _db = (e.target as IDBOpenDBRequest).result; resolve(_db) }
    req.onerror = () => reject(req.error)
  })
}

function idbGet<T>(store: string, key: string): Promise<T | undefined> {
  return openDB().then(
    db => new Promise<T | undefined>((resolve) => {
      const tx = db.transaction(store, 'readonly')
      const req = tx.objectStore(store).get(key)
      req.onsuccess = () => resolve(req.result as T | undefined)
      req.onerror = () => resolve(undefined)
    }),
  ).catch(() => undefined)
}

function idbSet(store: string, key: string, value: unknown): Promise<void> {
  return openDB().then(
    db => new Promise<void>((resolve) => {
      const tx = db.transaction(store, 'readwrite')
      tx.objectStore(store).put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    }),
  ).catch(() => undefined as void)
}

export async function getCachedWasm(url: string): Promise<ArrayBuffer | undefined> {
  return idbGet<ArrayBuffer>('wasm-cache', url)
}

export async function setCachedWasm(url: string, buffer: ArrayBuffer): Promise<void> {
  return idbSet('wasm-cache', url, buffer)
}

interface CachedResult { blob: Blob; timestamp: number }

export function fileFingerprint(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`
}

export async function getCachedResult(fingerprint: string, toolSlug: string): Promise<Blob | undefined> {
  const key = `${toolSlug}:${fingerprint}`
  const cached = await idbGet<CachedResult>('results', key)
  if (!cached) return undefined
  if (Date.now() - cached.timestamp > RESULT_TTL_MS) {
    openDB().then(db => {
      db.transaction('results', 'readwrite').objectStore('results').delete(key)
    }).catch(() => {})
    return undefined
  }
  return cached.blob
}

export async function setCachedResult(fingerprint: string, toolSlug: string, blob: Blob): Promise<void> {
  const key = `${toolSlug}:${fingerprint}`
  return idbSet('results', key, { blob, timestamp: Date.now() })
}

interface AnalyticsEvent { tool: string; ts: number }

const SESSION_KEY = 'docflow:analytics_queue'

export function enqueueAnalyticsEvent(toolSlug: string): void {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    const queue: AnalyticsEvent[] = raw ? (JSON.parse(raw) as AnalyticsEvent[]) : []
    queue.push({ tool: toolSlug, ts: Date.now() })
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(queue.slice(-50)))
  } catch { /* sessionStorage unavailable */ }
}

export function flushAnalyticsQueue(): AnalyticsEvent[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return []
    const queue = JSON.parse(raw) as AnalyticsEvent[]
    sessionStorage.removeItem(SESSION_KEY)
    return queue
  } catch { return [] }
}
