import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Zap } from 'lucide-react'
import clsx from 'clsx'
import SearchBar from '../ui/SearchBar'
import { prefetchProps } from '../../lib/routes'

const NAV = [
  { label: 'PDF Tools', href: '/tools#pdf' },
  { label: 'Image Tools', href: '/tools#image' },
  { label: 'Utilities', href: '/tools#utils' },
  { label: 'Blog', href: '/blog' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  const { pathname } = useLocation()

  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Elevate on scroll; slide away when scrolling down, return on scroll up
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const y = window.scrollY
      setScrolled(y > 8)
      const delta = y - lastY.current
      if (Math.abs(delta) > 6) {
        setHidden(delta > 0 && y > 240)
        lastY.current = y
      }
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])

  // Never hide the header while the mobile menu is open
  const slideAway = hidden && !mobileOpen

  return (
    <header
      className={clsx(
        'sticky top-0 z-50 border-b transition-all duration-300 will-change-transform',
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-gray-200/80 shadow-sm supports-[not(backdrop-filter)]:bg-white'
          : 'bg-white border-gray-200',
        slideAway ? '-translate-y-full' : 'translate-y-0',
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-4">
          <Link to="/" className="group flex items-center gap-2 shrink-0" aria-label="Filedit home">
            <div
              className="w-7 h-7 flex items-center justify-center bg-primary-600 rounded-lg shadow-sm shadow-primary-600/30 transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110"
              aria-hidden
            >
              <Zap className="w-4 h-4 text-white transition-transform duration-300 group-hover:scale-110" />
            </div>
            <span className="text-base font-bold text-gray-900 hidden sm:block">Filedit</span>
          </Link>

          <div className="flex-1 max-w-sm hidden md:block">
            <SearchBar placeholder="Search 30+ tools…" showShortcut />
          </div>

          <nav className="hidden md:flex items-center gap-0.5 ml-2" aria-label="Main navigation">
            {NAV.map(link => (
              <Link
                key={link.href}
                to={link.href}
                {...prefetchProps(link.href)}
                aria-current={pathname === link.href.split('#')[0] && link.href === '/blog' ? 'page' : undefined}
                className="nav-underline px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1 md:hidden" />

          <Link
            to="/tools"
            {...prefetchProps('/tools')}
            className="hidden md:inline-flex items-center px-4 py-1.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 hover:shadow-md hover:shadow-primary-600/25 active:scale-95 transition-all shrink-0"
          >
            All Tools
          </Link>

          <button
            className="md:hidden relative w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <Menu className={clsx('w-5 h-5 absolute transition-all duration-300', mobileOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100')} />
            <X className={clsx('w-5 h-5 absolute transition-all duration-300', mobileOpen ? 'opacity-100' : 'opacity-0 -rotate-90 scale-50')} />
          </button>
        </div>
      </div>

      {/* Mobile drawer: height animates via grid-rows, links stagger in */}
      <div className="accordion-body md:hidden" data-open={mobileOpen}>
        <div>
          <div className="border-t border-gray-100 bg-white">
            <div className="px-4 py-3">
              {mobileOpen && <SearchBar placeholder="Search tools…" />}
            </div>
            <nav className="px-2 pb-3" aria-label="Mobile navigation">
              {NAV.map((link, i) => (
                <Link
                  key={link.href}
                  to={link.href}
                  {...prefetchProps(link.href)}
                  style={{ transitionDelay: mobileOpen ? `${80 + i * 50}ms` : '0ms' }}
                  className={clsx(
                    'flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-300',
                    mobileOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3',
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 px-1">
                <Link
                  to="/tools"
                  className="flex items-center justify-center w-full py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 active:scale-[0.98] transition-all"
                >
                  Browse All Tools
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}
