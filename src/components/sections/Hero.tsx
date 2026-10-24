import { useEffect, useRef, useState } from 'react'
import { Shield, ArrowRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import CountUp from '../ui/CountUp'
import { prefetchProps } from '../../lib/routes'
import { canHover, prefersReducedMotion } from '../../lib/motion'

const STATS = [
  { to: 30, suffix: '+', label: 'Free tools' },
  { to: 100, suffix: '%', label: 'Browser-based' },
  { to: 0, suffix: '', label: 'Files uploaded' },
  { to: 50, suffix: 'MB', label: 'Max file size' },
]

const WORDS = ['compress', 'merge', 'split', 'convert', 'protect', 'scan']

const MARQUEE = [
  'Compress PDF', 'Merge PDF', 'Split PDF', 'PDF to Images', 'Remove Background',
  'Compress Image', 'QR Generator', 'OCR', 'Unlock PDF', 'Resize Image', 'Watermark PDF', 'Crop Image',
]

// depth = parallax strength; rot = resting rotation
const CHIPS = [
  { label: 'PDF',  cls: 'left-[6%] top-[14%]',   depth: 22, rot: -8, color: 'bg-red-50 text-red-600 border-red-100',       anim: 'animate-float' },
  { label: 'JPG',  cls: 'left-[13%] top-[60%]',  depth: 36, rot: 6,  color: 'bg-amber-50 text-amber-600 border-amber-100', anim: 'animate-float-delay' },
  { label: 'QR',   cls: 'left-[3%] top-[38%]',   depth: 14, rot: -4, color: 'bg-violet-50 text-violet-600 border-violet-100', anim: 'animate-float' },
  { label: 'PNG',  cls: 'right-[7%] top-[18%]',  depth: 30, rot: 7,  color: 'bg-sky-50 text-sky-600 border-sky-100',       anim: 'animate-float-delay' },
  { label: 'WEBP', cls: 'right-[12%] top-[62%]', depth: 20, rot: -6, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', anim: 'animate-float' },
  { label: 'OCR',  cls: 'right-[3%] top-[40%]',  depth: 40, rot: 4,  color: 'bg-primary-50 text-primary-600 border-primary-100', anim: 'animate-float-delay' },
]

function RotatingWord() {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (prefersReducedMotion()) return
    const id = window.setInterval(() => setI(n => (n + 1) % WORDS.length), 2200)
    return () => window.clearInterval(id)
  }, [])
  return (
    <span className="inline-block text-left" style={{ perspective: 400 }}>
      <span key={WORDS[i]} className="inline-block text-gradient-animated animate-word-in font-bold">
        {WORDS[i]}
      </span>
    </span>
  )
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null)

  // Mouse parallax for the floating chips (CSS variables only: no re-renders)
  useEffect(() => {
    const el = ref.current
    if (!el || !canHover() || prefersReducedMotion()) return
    let raf = 0
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        el.style.setProperty('--px', String((e.clientX - r.left) / r.width - 0.5))
        el.style.setProperty('--py', String((e.clientY - r.top) / r.height - 0.5))
      })
    }
    el.addEventListener('mousemove', onMove)
    return () => { el.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf) }
  }, [])

  return (
    <section ref={ref} className="relative overflow-hidden bg-white border-b border-gray-100">
      {/* Ambient background: drifting colour blobs + faded dot grid */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute -top-24 left-[10%] w-[28rem] h-[28rem] rounded-full bg-primary-300/30 blur-3xl animate-blob" />
        <div className="absolute top-10 right-[8%] w-[24rem] h-[24rem] rounded-full bg-violet-300/25 blur-3xl animate-blob-slow" />
        <div className="absolute -bottom-32 left-[40%] w-[26rem] h-[26rem] rounded-full bg-sky-300/25 blur-3xl animate-blob" style={{ animationDelay: '-8s' }} />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            maskImage: 'radial-gradient(ellipse 60% 60% at 50% 40%, #000 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 40%, #000 30%, transparent 75%)',
          }}
        />
      </div>

      {/* Floating file-type chips with depth-based parallax (large screens) */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none" aria-hidden>
        {CHIPS.map(c => (
          <div
            key={c.label}
            className={`absolute ${c.cls}`}
            style={{
              transform: `translate3d(calc(var(--px, 0) * ${c.depth}px), calc(var(--py, 0) * ${c.depth}px), 0)`,
              transition: 'transform 0.25s ease-out',
            }}
          >
            <div
              className={`${c.anim} px-3.5 py-2 rounded-xl border text-xs font-bold tracking-wider shadow-sm backdrop-blur ${c.color}`}
              style={{ ['--r' as string]: `${c.rot}deg` }}
            >
              .{c.label}
            </div>
          </div>
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-14">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50/80 text-primary-700 rounded-full text-xs font-semibold mb-6 border border-primary-100 backdrop-blur animate-fade-up">
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping" />
              <span className="relative w-2 h-2 rounded-full bg-emerald-500" />
            </span>
            <Shield className="w-3 h-3" />
            <span>All processing done locally — zero uploads</span>
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-gray-900 leading-[1.1] tracking-tight mb-5 animate-fade-up"
            style={{ animationDelay: '80ms' }}
          >
            Every document tool
            <br />
            <span className="text-gradient-animated">you'll ever need</span>
          </h1>

          <p
            className="text-lg text-gray-500 leading-relaxed mb-2 max-w-xl mx-auto animate-fade-up"
            style={{ animationDelay: '160ms' }}
          >
            The fastest way to <RotatingWord /> your files, instantly in your browser.
          </p>
          <p
            className="text-base text-gray-400 mb-8 animate-fade-up"
            style={{ animationDelay: '220ms' }}
          >
            No sign-up. No uploads. No nonsense.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12 animate-fade-up"
            style={{ animationDelay: '300ms' }}
          >
            <Link to="/tools" {...prefetchProps('/tools')}>
              <Button size="lg" variant="primary" icon={<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}>
                Browse All Tools
              </Button>
            </Link>
            <Link to="/pdf-compress" {...prefetchProps('/pdf-compress')}>
              <Button size="lg" variant="secondary">Compress a PDF</Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 animate-fade-up" style={{ animationDelay: '380ms' }}>
            {STATS.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-black text-gray-900">
                  <CountUp to={stat.to} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Infinite marquee: pauses on hover, edges fade out */}
      <div
        className="relative border-t border-gray-100 bg-gray-50/80 py-3 overflow-hidden group"
        style={{
          maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
        }}
      >
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
          {[0, 1].map(dup => (
            <ul key={dup} className="flex shrink-0 items-center gap-x-8 pr-8" aria-hidden={dup === 1}>
              {MARQUEE.map(tool => (
                <li key={tool} className="text-xs text-gray-500 flex items-center gap-1.5 whitespace-nowrap">
                  <Star className="w-2.5 h-2.5 text-primary-500 fill-primary-500" />
                  {tool}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  )
}
