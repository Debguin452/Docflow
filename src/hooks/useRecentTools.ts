import { useState } from 'react'
import { ALL_TOOLS, type ToolMeta } from '../data/tools'

const KEY = 'filedit:recent'
const MAX = 6

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function recordRecentTool(id: string): void {
  try {
    const list = [id, ...read().filter(x => x !== id)].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch { /* storage unavailable (private mode) – ignore */ }
}

export function useRecentTools(): ToolMeta[] {
  const [tools] = useState(() =>
    read().map(id => ALL_TOOLS.find(t => t.id === id)).filter((t): t is ToolMeta => !!t),
  )
  return tools
}
