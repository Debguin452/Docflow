import { prefersReducedMotion } from './motion'

let running = false

/** Lightweight canvas confetti burst (~1.5 KB, no dependency). */
export function celebrate(): void {
  if (running || prefersReducedMotion() || typeof document === 'undefined') return
  running = true

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const canvas = document.createElement('canvas')
  const w = window.innerWidth
  const h = window.innerHeight
  canvas.width = w * dpr
  canvas.height = h * dpr
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '9999',
  })
  canvas.setAttribute('aria-hidden', 'true')
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  const colors = ['#2563eb', '#60a5fa', '#7c3aed', '#10b981', '#f59e0b', '#ef4444']
  const parts = Array.from({ length: 80 }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6
    const speed = 7 + Math.random() * 9
    return {
      x: w / 2, y: h * 0.7,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 5, rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4, color: colors[(Math.random() * colors.length) | 0],
      round: Math.random() < 0.3, life: 80 + Math.random() * 60,
    }
  })

  let frame = 0
  const tick = () => {
    ctx.clearRect(0, 0, w, h)
    let alive = 0
    for (const p of parts) {
      if (p.life <= 0) continue
      alive++
      p.vy += 0.38; p.vx *= 0.985; p.vy *= 0.985
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--
      ctx.save()
      ctx.globalAlpha = Math.min(1, p.life / 30)
      ctx.translate(p.x, p.y); ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill() }
      else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      ctx.restore()
    }
    if (alive && frame++ < 260) requestAnimationFrame(tick)
    else { canvas.remove(); running = false }
  }
  requestAnimationFrame(tick)
}
