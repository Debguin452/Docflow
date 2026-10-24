import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Router doesn't manage scroll or focus. On navigation:
 *  - "#hash" links smooth-scroll to the element (retrying while a lazy page mounts)
 *  - otherwise jump to top instantly and move focus to <main> for screen readers
 */
export default function ScrollManager() {
  const { pathname, hash } = useLocation()
  const isFirst = useRef(true)

  useEffect(() => {
    let raf = 0
    if (hash) {
      let tries = 0
      const seek = () => {
        const el = document.getElementById(decodeURIComponent(hash.slice(1)))
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        else if (tries++ < 40) raf = requestAnimationFrame(seek)
      }
      seek()
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
      if (!isFirst.current) document.getElementById('main')?.focus({ preventScroll: true })
    }
    isFirst.current = false
    return () => cancelAnimationFrame(raf)
  }, [pathname, hash])

  return null
}
