import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * A crash inside one tool (or a failed chunk download after a deploy) must never
 * blank the whole site. Shows a friendly recovery screen instead.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Filedit render error:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const isChunkError = /Loading chunk|dynamically imported module|Importing a module script failed/i.test(error.message)
    return (
      <div role="alert" className="max-w-lg mx-auto px-4 py-20 text-center animate-fade-up">
        <div className="w-14 h-14 mx-auto mb-5 flex items-center justify-center rounded-2xl bg-amber-50 text-amber-600 animate-pop">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          {isChunkError ? 'A new version is available' : 'Something went wrong'}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {isChunkError
            ? 'Filedit was updated while this page was open. Reload to get the latest version.'
            : 'This tool hit an unexpected problem. Your files were not uploaded anywhere. Try reloading the page.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Reload
          </button>
          <Link
            to="/"
            onClick={() => this.setState({ error: null })}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
          >
            <Home className="w-4 h-4" /> Home
          </Link>
        </div>
      </div>
    )
  }
}
