import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react'
import Fuse from 'fuse.js'
import { ALL_TOOLS, type ToolMeta } from '../data/tools'

interface SearchContextValue {
  query: string
  setQuery: (q: string) => void
  results: ToolMeta[]
  isOpen: boolean
  setIsOpen: (v: boolean) => void
  clear: () => void
}

const SearchContext = createContext<SearchContextValue | null>(null)

const fuse = new Fuse(ALL_TOOLS, {
  keys: [
    { name: 'name', weight: 0.5 },
    { name: 'tags', weight: 0.3 },
    { name: 'shortDesc', weight: 0.2 },
  ],
  threshold: 0.35,
  includeScore: true,
})

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQueryRaw] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const results = useMemo((): ToolMeta[] => {
    if (!query.trim()) return ALL_TOOLS.slice(0, 8)
    return fuse.search(query).map(r => r.item).slice(0, 12)
  }, [query])

  const setQuery = useCallback((q: string) => {
    setQueryRaw(q)
    if (q.length > 0) setIsOpen(true)
  }, [])

  const clear = useCallback(() => {
    setQueryRaw('')
    setIsOpen(false)
  }, [])

  return (
    <SearchContext.Provider value={{ query, setQuery, results, isOpen, setIsOpen, clear }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error('useSearch must be used inside SearchProvider')
  return ctx
}
