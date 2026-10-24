import { describe, it, expect } from 'vitest'
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib'
import { runPool, LRU } from '../lib/async'
import { searchTools } from '../lib/search'
import { ALL_TOOLS } from '../data/tools'
import { compressPDFBytes, type JpegRecompressor } from '../lib/pdf/operations'
import { TOOL_LOADERS, PAGE_LOADERS } from '../lib/routes'

describe('runPool', () => {
  it('never exceeds the concurrency limit and keeps input order', async () => {
    let inFlight = 0
    let peak = 0
    const items = Array.from({ length: 12 }, (_, i) => i)
    const res = await runPool(items, 3, async n => {
      inFlight++; peak = Math.max(peak, inFlight)
      await new Promise(r => setTimeout(r, 5))
      inFlight--
      return n * 2
    })
    expect(peak).toBe(3)
    expect(res.map(r => (r.status === 'fulfilled' ? r.value : null))).toEqual(items.map(n => n * 2))
  })

  it('isolates failures and reports progress for every item', async () => {
    const seen: number[] = []
    const res = await runPool([1, 2, 3, 4], 2, async n => {
      if (n === 2) throw new Error('boom')
      return n
    }, done => seen.push(done))
    expect(res.map(r => r.status)).toEqual(['fulfilled', 'rejected', 'fulfilled', 'fulfilled'])
    expect(seen).toEqual([1, 2, 3, 4])
  })

  it('handles an empty list', async () => {
    expect(await runPool([], 3, async () => 1)).toEqual([])
  })
})

describe('LRU', () => {
  it('evicts the least recently used entry', () => {
    const c = new LRU<string, number>(2)
    c.set('a', 1); c.set('b', 2)
    c.get('a') // a becomes most recent
    c.set('c', 3) // evicts b
    expect(c.has('a')).toBe(true)
    expect(c.has('b')).toBe(false)
    expect(c.has('c')).toBe(true)
  })
})

describe('searchTools', () => {
  it('finds tools by name and by tag, and tolerates typos', () => {
    expect(searchTools(ALL_TOOLS, 'merge', 'all')[0].slug).toBe('merge-pdf')
    expect(searchTools(ALL_TOOLS, 'qr', 'all').some(t => t.slug === 'qr-generator')).toBe(true)
    expect(searchTools(ALL_TOOLS, 'compres', 'all').some(t => t.slug === 'pdf-compress')).toBe(true)
  })
  it('returns nothing for gibberish', () => {
    expect(searchTools(ALL_TOOLS, 'zzzzqqqxxx', 'all')).toEqual([])
  })
})

describe('route registry', () => {
  it('has a loader for every tool in the catalogue (and nothing extra)', () => {
    const slugs = ALL_TOOLS.map(t => t.slug).sort()
    expect(Object.keys(TOOL_LOADERS).sort()).toEqual(slugs)
  })

  it('every page and tool loader resolves to a component', async () => {
    const loaders = [...Object.values(PAGE_LOADERS), ...Object.values(TOOL_LOADERS)]
    const mods = await Promise.all(loaders.map(l => l()))
    mods.forEach(m => expect(typeof m.default).toBe('function'))
  }, 60_000)
})

// ── PDF compression ───────────────────────────────────────────────────────
/** A valid 8×8 RGB JPEG padded with a 6 KB COM segment so it is "big" for the size check. */
function paddedJpeg(): Uint8Array {
  const tiny = Uint8Array.from(atob(
    '/9j/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCAAIAAgDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAT/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAABQb/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCUAQpH/9k=',
  ), c => c.charCodeAt(0))
  const pad = 6000
  const com = new Uint8Array(4 + pad)
  com.set([0xff, 0xfe, ((pad + 2) >> 8) & 0xff, (pad + 2) & 0xff])
  const out = new Uint8Array(2 + com.length + tiny.length - 2)
  out.set(tiny.subarray(0, 2), 0)
  out.set(com, 2)
  out.set(tiny.subarray(2), 2 + com.length)
  return out
}

async function pdfWithImage(): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const img = await doc.embedJpg(paddedJpeg())
  const page = doc.addPage([200, 200])
  page.drawImage(img, { x: 0, y: 0, width: 100, height: 100 })
  page.drawText('keep me')
  return doc.save()
}

function imageStreams(pdf: PDFDocument) {
  return [...pdf.context.enumerateIndirectObjects()]
    .map(([, o]) => o)
    .filter((o): o is PDFRawStream => o instanceof PDFRawStream && o.dict.get(PDFName.of('Subtype')) === PDFName.of('Image'))
}

describe('compressPDFBytes', () => {
  const shrink: JpegRecompressor = async () => ({ bytes: new Uint8Array(200), width: 7, height: 5 })

  it('re-encodes embedded JPEGs and writes the new dimensions', async () => {
    const input = await pdfWithImage()
    const out = await compressPDFBytes(input, 'medium', shrink)
    expect(out.length).toBeLessThan(input.length - 4000)

    const reloaded = await PDFDocument.load(out)
    expect(reloaded.getPageCount()).toBe(1)
    const [img] = imageStreams(reloaded)
    expect(img.getContents().length).toBe(200)
    expect(String(img.dict.get(PDFName.of('Width')))).toBe('7')
    expect(String(img.dict.get(PDFName.of('Height')))).toBe('5')
  })

  it('passes the right quality preset per level', async () => {
    const input = await pdfWithImage()
    const seen: Record<string, number> = {}
    for (const level of ['low', 'medium', 'high'] as const) {
      await compressPDFBytes(input, level, async (_b, _w, _h, o) => { seen[level] = o.quality; return null })
    }
    expect(seen.low).toBeGreaterThan(seen.medium)
    expect(seen.medium).toBeGreaterThan(seen.high)
  })

  it('returns the original bytes when nothing can be improved', async () => {
    const input = await pdfWithImage()
    const out = await compressPDFBytes(input, 'high', async () => null)
    expect(out.length).toBeLessThanOrEqual(input.length)
  })

  it('ignores a re-encode that is not meaningfully smaller', async () => {
    const input = await pdfWithImage()
    const bigger: JpegRecompressor = async () => ({ bytes: new Uint8Array(9000), width: 1, height: 1 })
    const out = await compressPDFBytes(input, 'low', bigger)
    const [img] = imageStreams(await PDFDocument.load(out))
    expect(img.getContents().length).toBeGreaterThan(5000) // untouched
  })

  it('survives an image that fails to re-encode', async () => {
    const input = await pdfWithImage()
    const out = await compressPDFBytes(input, 'medium', async () => { throw new Error('decode failed') })
    expect((await PDFDocument.load(out)).getPageCount()).toBe(1)
  })

  it('reports progress up to 100', async () => {
    const input = await pdfWithImage()
    const prog: number[] = []
    await compressPDFBytes(input, 'medium', shrink, p => prog.push(p))
    expect(prog[prog.length - 1]).toBe(100)
  })
})

describe('catalogue integrity', () => {
  it("every getToolBySlug('…') lookup in a component points at a real tool", () => {
    // Regression: PDFMerge/PDFSplit looked up 'pdf-merge'/'pdf-split' (real slugs are
    // 'merge-pdf'/'split-pdf'); the non-null `!` hid it and both tools crashed on load.
    const sources = import.meta.glob('../components/**/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
    const known = new Set(ALL_TOOLS.map(t => t.slug))
    const bad: string[] = []
    for (const [file, src] of Object.entries(sources)) {
      for (const m of src.matchAll(/getToolBySlug\('([^']+)'\)/g)) {
        if (!known.has(m[1])) bad.push(`${file} → '${m[1]}'`)
      }
    }
    expect(bad).toEqual([])
  })

  it('every tool has a unique slug and id', () => {
    expect(new Set(ALL_TOOLS.map(t => t.slug)).size).toBe(ALL_TOOLS.length)
    expect(new Set(ALL_TOOLS.map(t => t.id)).size).toBe(ALL_TOOLS.length)
  })
})
