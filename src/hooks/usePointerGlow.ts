import { useCallback, useRef } from 'react'
import { canHover, prefersReducedMotion } from '../lib/motion'

/**
 * Pointer-follow effects without React re-renders: writes CSS variables
 * (--mx/--my for the spotlight, --rx/--ry for tilt) straight onto the element,
 * throttled with requestAnimationFrame. Disabled on touch and reduced-motion.
 */
export function usePointerGlow({ tilt = false, maxTilt = 5 } = {}) {
  const raf = useRef(0)

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!canHover()) return
      const el = e.currentTarget
      const { clientX, clientY } = e
      cancelAnimationFrame(raf.current)
      raf.current = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const x = clientX - r.left
        const y = clientY - r.top
        el.style.setProperty('--mx', `${x}px`)
        el.style.setProperty('--my', `${y}px`)
        if (tilt && !prefersReducedMotion()) {
          el.style.setProperty('--ry', `${(x / r.width - 0.5) * maxTilt * 2}deg`)
          el.style.setProperty('--rx', `${-(y / r.height - 0.5) * maxTilt * 2}deg`)
        }
      })
    },
    [tilt, maxTilt],
  )

  const onMouseLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    cancelAnimationFrame(raf.current)
    e.currentTarget.style.setProperty('--rx', '0deg')
    e.currentTarget.style.setProperty('--ry', '0deg')
  }, [])

  return { onMouseMove, onMouseLeave }
}
