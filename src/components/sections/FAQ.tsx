import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import type { FAQItem } from '../../types'

interface FAQProps {
  items: FAQItem[]
  title?: string
  subtitle?: string
  schema?: boolean
}

function FAQAccordionItem({ item, open, onToggle }: { item: FAQItem; open: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-gray-900">{item.question}</span>
        <ChevronDown
          className={clsx(
            'w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 bg-gray-50 border-t border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed pt-3">{item.answer}</p>
        </div>
      )}
    </div>
  )
}

export default function FAQ({ items, title = 'Frequently Asked Questions', subtitle }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-3">FAQ</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{title}</h2>
          {subtitle && <p className="text-base text-gray-500">{subtitle}</p>}
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <FAQAccordionItem
              key={i}
              item={item}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
