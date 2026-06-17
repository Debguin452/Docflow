import { Link } from 'react-router-dom'
import * as Icons from 'lucide-react'
import Badge from './Badge'
import type { ToolMeta } from '../../types'

interface ToolCardProps {
  tool: ToolMeta
  compact?: boolean
}

export default function ToolCard({ tool, compact = false }: ToolCardProps) {
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[tool.icon] ?? Icons.Wrench

  if (compact) {
    return (
      <Link
        to={`/${tool.slug}`}
        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-primary-200 hover:shadow-card transition-all duration-200 group"
      >
        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-50 text-primary-600 shrink-0 group-hover:bg-primary-100 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{tool.name}</span>
      </Link>
    )
  }

  return (
    <Link
      to={`/${tool.slug}`}
      className="group flex flex-col gap-4 p-5 bg-white border border-gray-200 rounded-xl hover:border-primary-200 hover:shadow-card-hover transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary-50 text-primary-600 group-hover:bg-primary-100 transition-colors shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex gap-1 flex-wrap justify-end">
          {tool.popular && <Badge variant="blue">Popular</Badge>}
          {tool.new && <Badge variant="green">New</Badge>}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors leading-snug">
          {tool.name}
        </h3>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{tool.shortDesc}</p>
      </div>
    </Link>
  )
}
