import { useEffect, useRef } from 'react'

/** Thin reading-progress bar. Updates a transform via rAF: no React re-renders. */
export default function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0
      if (bar.current) {
        bar.current.style.transform = `scaleX(${p})`
        bar.current.style.opacity = p > 0.005 ? '1' : '0'
      }
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 h-0.5 z-[60] pointer-events-none" aria-hidden>
      <div
        ref={bar}
        className="h-full origin-left bg-gradient-to-r from-primary-500 via-violet-500 to-sky-400 opacity-0 transition-opacity duration-300"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  )
}
