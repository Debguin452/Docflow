/**
 * Run `worker` over `items` with at most `concurrency` in flight.
 * Results keep input order; a failing item never aborts the others.
 */
export async function runPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length)
  let next = 0
  let done = 0

  async function lane() {
    while (next < items.length) {
      const i = next++
      try {
        results[i] = { status: 'fulfilled', value: await worker(items[i], i) }
      } catch (reason) {
        results[i] = { status: 'rejected', reason }
      }
      onProgress?.(++done, items.length)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, lane))
  return results
}

/** Tiny bounded LRU map. */
export class LRU<K, V> {
  private map = new Map<K, V>()
  constructor(private max: number) {}
  get(key: K): V | undefined {
    const v = this.map.get(key)
    if (v !== undefined) { this.map.delete(key); this.map.set(key, v) }
    return v
  }
  set(key: K, value: V): void {
    this.map.delete(key)
    this.map.set(key, value)
    if (this.map.size > this.max) this.map.delete(this.map.keys().next().value as K)
  }
  has(key: K): boolean { return this.map.has(key) }
  clear(): void { this.map.clear() }
}
