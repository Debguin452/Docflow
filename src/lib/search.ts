import Fuse from 'fuse.js'
import type { ToolMeta } from '../data/tools'

const OPTIONS = {
  keys: [
    { name: 'name', weight: 0.5 },
    { name: 'tags', weight: 0.3 },
    { name: 'shortDesc', weight: 0.2 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
}

// Building a Fuse index is the expensive part. Build once per distinct list
// (keyed by caller-supplied id) and reuse it for every keystroke.
const indexes = new Map<string, Fuse<ToolMeta>>()

export function searchTools(items: ToolMeta[], query: string, cacheKey: string): ToolMeta[] {
  let fuse = indexes.get(cacheKey)
  if (!fuse) {
    fuse = new Fuse(items, OPTIONS)
    indexes.set(cacheKey, fuse)
  }
  return fuse.search(query.trim()).map(r => r.item)
}
