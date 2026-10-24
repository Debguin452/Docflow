import { memo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Badge from './Badge'
import Reveal from './Reveal'
import { getIcon } from '../../lib/icons'
import { prefetchProps } from '../../lib/routes'
import { usePointerGlow } from '../../hooks/usePointerGlow'
import type { ToolMeta } from '../../types'

interface ToolCardProps {
  tool: ToolMeta
  compact?: boolean
  /** Position in a grid; drives the staggered entrance */
  index?: number
}

function ToolCard({ tool, compact = false, index = 0 }: ToolCardProps) {
  const Icon = getIcon(tool.icon)
  const glow = usePointerGlow({ tilt: !compact, maxTilt: 4 })
  const href = `/${tool.slug}`

  if (compact) {
    return (
      <Link
        to={href}
        {...prefetchProps(href)}
        {...glow}
        className="spotlight flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-primary-200 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 group"
      >
        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-50 text-primary-600 shrink-0 group-hover:bg-primary-100 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{tool.name}</span>
        <ArrowRight className="w-3.5 h-3.5 ml-auto text-primary-500 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
      </Link>
    )
  }

  return (
    <Reveal delay={(index % 4) * 70} className="h-full">
      <Link
        to={href}
        {...prefetchProps(href)}
        {...glow}
        className="spotlight tilt group relative flex flex-col gap-4 p-5 h-full bg-white border border-gray-200 rounded-xl hover:border-primary-200 hover:shadow-card-hover cursor-pointer"
      >
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-lg group-hover:shadow-primary-600/30 transition-all duration-300 shrink-0">
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

        <ArrowRight className="absolute bottom-4 right-4 w-4 h-4 text-primary-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
      </Link>
    </Reveal>
  )
}

export default memo(ToolCard)
