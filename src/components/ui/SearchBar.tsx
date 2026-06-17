import { useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import * as Icons from 'lucide-react'
import clsx from 'clsx'
import { useSearch } from '../../context/SearchContext'
import type { ToolMeta } from '../../data/tools'

interface SearchBarProps {
  className?: string
  placeholder?: string
  autoFocus?: boolean
}

function ResultItem({
  tool,
  focused,
  onClick,
}: {
  tool: ToolMeta
  focused: boolean
  onClick: () => void
}) {
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[tool.icon] ?? Icons.Wrench

  return (
    <button
      onMouseDown={onClick}
      className={clsx(
        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
        focused ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50',
      )}
    >
      <div
        className={clsx(
          'w-7 h-7 flex items-center justify-center rounded shrink-0',
          focused ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500',
        )}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{tool.name}</p>
        <p className="text-xs text-gray-400 truncate">{tool.shortDesc}</p>
      </div>
      <span
        className={clsx(
          'text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0',
          tool.category === 'pdf'
            ? 'bg-blue-50 text-blue-600'
            : tool.category === 'image'
            ? 'bg-green-50 text-green-600'
            : 'bg-orange-50 text-orange-600',
        )}
      >
        {tool.category}
      </span>
    </button>
  )
}

export default function SearchBar({ className, placeholder = 'Search tools…', autoFocus }: SearchBarProps) {
  const { query, setQuery, results, isOpen, setIsOpen, clear } = useSearch()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const focusedIdxRef = useRef(-1)
  const navigate = useNavigate()

  // Reset focused index when results change
  useEffect(() => {
    focusedIdxRef.current = -1
  }, [results])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [setIsOpen])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        focusedIdxRef.current = Math.min(focusedIdxRef.current + 1, results.length - 1)
        inputRef.current?.closest('[data-focused-idx]')
        const items = containerRef.current?.querySelectorAll<HTMLElement>('[data-result-item]')
        if (items) {
          items.forEach((el, i) => {
            el.setAttribute('data-focused', String(i === focusedIdxRef.current))
          })
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        focusedIdxRef.current = Math.max(focusedIdxRef.current - 1, -1)
        const items = containerRef.current?.querySelectorAll<HTMLElement>('[data-result-item]')
        if (items) {
          items.forEach((el, i) => {
            el.setAttribute('data-focused', String(i === focusedIdxRef.current))
          })
        }
      } else if (e.key === 'Enter') {
        const tool = focusedIdxRef.current >= 0 ? results[focusedIdxRef.current] : results[0]
        if (tool) {
          clear()
          navigate(`/${tool.slug}`)
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    },
    [isOpen, results, clear, navigate, setIsOpen],
  )

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          aria-label="Search tools"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
        />
        {query && (
          <button
            onClick={clear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Search results"
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-[400px] overflow-y-auto"
        >
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No tools match &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {query === '' && (
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Popular tools
                  </p>
                </div>
              )}
              {results.map((tool, i) => (
                <div key={tool.id} data-result-item>
                  <ResultItem
                    tool={tool}
                    focused={false}
                    onClick={() => {
                      clear()
                      navigate(`/${tool.slug}`)
                    }}
                  />
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
