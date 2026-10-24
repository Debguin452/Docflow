import { useLocation } from 'react-router-dom'

/** Re-keys on path change so the page-in animation replays for every navigation. */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  return <div key={pathname} className="animate-page-in">{children}</div>
}
