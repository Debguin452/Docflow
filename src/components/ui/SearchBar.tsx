import { useRef, useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import clsx from 'clsx'
import { useSearch } from '../../context/SearchContext'
import { getIcon } from '../../lib/icons'
import { prefetchPath } from '../../lib/routes'
import type { ToolMeta } from '../../data/tools'

interface SearchBarProps {
  className?: string
  placeholder?: string
  autoFocus?: boolean
  /** Show the "/" keyboard hint inside the input (desktop header) */
  showShortcut?: boolean
}

function ResultItem({
  tool, active, id, onSelect, onHover,
}: {
  tool: ToolMeta
  active: boolean
  id: string
  onSelect: () => void
  onHover: () => void
}) {
  const Icon = getIcon(tool.icon)
  return (
    <button
      id={id}
      role="option"
      aria-selected={active}
      onMouseDown={e => { e.preventDefault(); onSelect() }}
      onMouseEnter={onHover}
      className={clsx(
        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100',
        active ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50',
      )}
    >
      <div
        className={clsx(
          'w-7 h-7 flex items-center justify-center rounded shrink-0 transition-transform duration-200',
          active ? 'bg-primary-100 text-primary-600 scale-110' : 'bg-gray-100 text-gray-500',
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
          tool.category === 'pdf' ? 'bg-blue-50 text-blue-600'
            : tool.category === 'image' ? 'bg-green-50 text-green-600'
            : 'bg-orange-50 text-orange-600',
        )}
      >
        {tool.category}
      </span>
    </button>
  )
}

export default function SearchBar({ className, placeholder = 'Search tools…', autoFocus, showShortcut }: SearchBarProps) {
  const { query, setQuery, results, isOpen, setIsOpen, clear } = useSearch()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(-1)
  const navigate = useNavigate()
  const listId = 'search-listbox'

  useEffect(() => { setActive(-1) }, [results])

  // Warm the chunk for whatever the keyboard/mouse is pointing at
  useEffect(() => {
    const tool = results[active]
    if (tool) prefetchPath(`/${tool.slug}`)
  }, [active, results])

  // Keep the highlighted option visible when arrowing through a long list
  useEffect(() => {
    if (active < 0) return
    containerRef.current?.querySelector(`#${listId}-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  // Close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [setIsOpen])

  // Global shortcuts: "/" or Ctrl/Cmd+K focuses the search box
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = inputRef.current
      if (!el || el.offsetParent === null) return // hidden instance (e.g. desktop bar on mobile)
      const target = e.target as HTMLElement | null
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault()
        el.focus()
        el.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const go = useCallback((tool: ToolMeta) => {
    clear()
    inputRef.current?.blur()
    navigate(`/${tool.slug}`)
  }, [clear, navigate])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setIsOpen(false); inputRef.current?.blur(); return }
    if (!isOpen || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => (i + 1) % results.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => (i <= 0 ? results.length - 1 : i - 1)) }
    else if (e.key === 'Enter') {
      const tool = results[active >= 0 ? active : 0]
      if (tool) { e.preventDefault(); go(tool) }
    }
  }

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-colors group-focus-within:text-primary-500" />
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all [&::-webkit-search-cancel-button]:hidden"
          aria-label="Search tools"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          role="combobox"
        />
        {query ? (
          <button
            onClick={() => { clear(); inputRef.current?.focus() }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : showShortcut ? (
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center justify-center w-5 h-5 text-[11px] font-mono text-gray-400 bg-gray-50 border border-gray-200 rounded pointer-events-none group-focus-within:opacity-0 transition-opacity">
            /
          </kbd>
        ) : null}
      </div>

      {isOpen && (
        <div
          id={listId}
          role="listbox"
          aria-label="Search results"
          className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-[400px] overflow-y-auto animate-dropdown origin-top"
        >
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No tools match &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {query === '' && (
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Popular tools</p>
                </div>
              )}
              {results.map((tool, i) => (
                <ResultItem
                  key={tool.id}
                  id={`${listId}-${i}`}
                  tool={tool}
                  active={i === active}
                  onHover={() => setActive(i)}
                  onSelect={() => go(tool)}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
