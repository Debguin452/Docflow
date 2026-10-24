import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react'
import { searchTools } from '../lib/search'
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

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQueryRaw] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const results = useMemo((): ToolMeta[] => {
    if (!query.trim()) return ALL_TOOLS.slice(0, 8)
    return searchTools(ALL_TOOLS, query, 'all').slice(0, 12)
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
