import { createElement, type CSSProperties, type ElementType, type ReactNode } from 'react'
import clsx from 'clsx'
import { useInView } from '../../hooks/useInView'

interface RevealProps {
  children: ReactNode
  /** Stagger delay in ms */
  delay?: number
  dir?: 'up' | 'left' | 'right' | 'none'
  as?: ElementType
  className?: string
}

/** Fades/slides its children in the first time they scroll into view. */
export default function Reveal({ children, delay = 0, dir = 'up', as = 'div', className }: RevealProps) {
  const [ref, inView] = useInView<HTMLElement>()
  return createElement(
    as,
    {
      ref,
      'data-dir': dir,
      className: clsx('reveal', inView && 'is-visible', className),
      style: { '--reveal-delay': `${delay}ms` } as CSSProperties,
    },
    children,
  )
}
