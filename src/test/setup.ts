import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => cleanup())

// jsdom lacks these browser APIs that the app relies on
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
})

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
Element.prototype.scrollIntoView = vi.fn()

// IntersectionObserver that reports "visible" immediately
class ImmediateIO {
  constructor(private cb: IntersectionObserverCallback) {}
  observe(el: Element) {
    this.cb([{ isIntersecting: true, target: el } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}
;(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = ImmediateIO

// jsdom doesn't implement canvas: provide a permissive fake 2D context
const fakeCtx = new Proxy({} as Record<string, unknown>, {
  get: (t, k: string) => (k in t ? t[k] : k === 'measureText' ? () => ({ width: 0 }) : vi.fn()),
  set: (t, k: string, v) => { t[k] = v; return true },
})
HTMLCanvasElement.prototype.getContext = vi.fn(() => fakeCtx) as unknown as typeof HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,') as unknown as typeof HTMLCanvasElement.prototype.toDataURL
