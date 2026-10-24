import { Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/layout/Layout'
import PageTransition from './components/layout/PageTransition'
import ErrorBoundary from './components/layout/ErrorBoundary'
import { SearchProvider } from './context/SearchContext'
import { LAZY_PAGES, LAZY_TOOLS, prefetchWhenIdle } from './lib/routes'
import { POPULAR_TOOLS } from './data/tools'

const { Home, Tools, About, Privacy, Terms, Blog, BlogPost, NotFound } = LAZY_PAGES

/** Skeleton shown only while a route chunk is loading for the first time. */
function PageLoader() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-5" role="status" aria-label="Loading">
      <div className="skeleton h-8 w-1/3" />
      <div className="skeleton h-4 w-2/3" />
      <div className="skeleton h-64 w-full !rounded-xl" />
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="skeleton h-24" /><div className="skeleton h-24" /><div className="skeleton h-24" />
      </div>
    </div>
  )
}

/** Warm the most-used tool chunks once the browser is idle (skipped on slow/metered links). */
function IdlePrefetch() {
  useEffect(() => {
    prefetchWhenIdle(POPULAR_TOOLS.slice(0, 3).map(t => t.slug))
  }, [])
  return null
}

function AppRoutes() {
  const location = useLocation()
  return (
    // keyed by path: navigating away from a crashed page recovers automatically
    <ErrorBoundary key={location.pathname}>
    <PageTransition>
      <Suspense fallback={<PageLoader />}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />

          {/* One route per tool, generated from the loader registry */}
          {Object.entries(LAZY_TOOLS).map(([slug, Tool]) => (
            <Route key={slug} path={`/${slug}`} element={<Tool />} />
          ))}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </PageTransition>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    // startTransition keeps the current page on screen while the next chunk loads
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SearchProvider>
        <Layout>
          <AppRoutes />
        </Layout>
        <IdlePrefetch />
      </SearchProvider>
    </BrowserRouter>
  )
}
