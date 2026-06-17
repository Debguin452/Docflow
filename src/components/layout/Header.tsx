import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Zap, FileText, Image, Wrench } from 'lucide-react'
import SearchBar from '../ui/SearchBar'

const NAV = [
  { label: 'PDF Tools', href: '/tools#pdf', icon: FileText },
  { label: 'Image Tools', href: '/tools#image', icon: Image },
  { label: 'Utilities', href: '/tools#utils', icon: Wrench },
  { label: 'Blog', href: '/blog' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-shadow duration-150 ${
        scrolled ? 'shadow-sm' : ''
      } border-b border-gray-200`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="DocFlow home">
            <div className="w-7 h-7 flex items-center justify-center bg-primary-600 rounded-lg" aria-hidden>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900 hidden sm:block">DocFlow</span>
          </Link>

          {/* Search – grows */}
          <div className="flex-1 max-w-sm hidden md:block">
            <SearchBar placeholder="Search 30+ tools…" />
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 ml-2" aria-label="Main navigation">
            {NAV.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  pathname === link.href.split('#')[0] && link.href !== '/tools'
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Spacer */}
          <div className="flex-1 md:hidden" />

          {/* CTA */}
          <Link
            to="/tools"
            className="hidden md:inline-flex items-center px-4 py-1.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors shrink-0"
          >
            All Tools
          </Link>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3">
            <SearchBar placeholder="Search tools…" autoFocus />
          </div>
          <nav className="px-2 pb-3" aria-label="Mobile navigation">
            {NAV.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 px-1">
              <Link
                to="/tools"
                className="flex items-center justify-center w-full py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                Browse All Tools
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
