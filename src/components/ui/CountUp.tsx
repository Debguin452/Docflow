import { useEffect, useState } from 'react'
import { useInView } from '../../hooks/useInView'
import { prefersReducedMotion } from '../../lib/motion'

interface CountUpProps {
  to: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

/** Counts from 0 to `to` the first time it is visible. */
export default function CountUp({ to, prefix = '', suffix = '', duration = 1400, className }: CountUpProps) {
  const [ref, inView] = useInView<HTMLSpanElement>()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (prefersReducedMotion() || to === 0) { setValue(to); return }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setValue(Math.round(to * easeOutExpo(t)))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration])

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}{value}{suffix}
    </span>
  )
}
