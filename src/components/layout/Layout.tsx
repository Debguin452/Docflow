import Header from './Header'
import Footer from './Footer'
import ScrollManager from './ScrollManager'
import ScrollProgress from './ScrollProgress'
import BackToTop from './BackToTop'
import OfflineBanner from './OfflineBanner'
import ToastHost from './ToastHost'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="skip-link">Skip to content</a>
      <ScrollManager />
      <ScrollProgress />
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>
      <Footer />
      <BackToTop />
      <OfflineBanner />
      <ToastHost />
    </div>
  )
}
