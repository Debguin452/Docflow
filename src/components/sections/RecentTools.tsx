import { History } from 'lucide-react'
import ToolCard from '../ui/ToolCard'
import Reveal from '../ui/Reveal'
import { useRecentTools } from '../../hooks/useRecentTools'

/** "Pick up where you left off": only renders once the visitor has used a tool. */
export default function RecentTools() {
  const tools = useRecentTools()
  if (tools.length === 0) return null

  return (
    <section className="py-8 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal dir="none">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            <History className="w-3.5 h-3.5" />
            Pick up where you left off
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {tools.map(t => (
              <ToolCard key={t.id} tool={t} compact />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
