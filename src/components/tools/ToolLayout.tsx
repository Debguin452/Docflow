import * as Icons from 'lucide-react'
import Breadcrumb from '../ui/Breadcrumb'
import ToolCard from '../ui/ToolCard'
import SEOHead from '../ui/SEOHead'
import FAQ from '../sections/FAQ'
import Badge from '../ui/Badge'
import type { ToolMeta, FAQItem } from '../../types'
import { getRelatedTools } from '../../data/tools'

interface ToolLayoutProps {
  tool: ToolMeta
  children: React.ReactNode
  faqs?: FAQItem[]
}

const STEPS = [
  { num: '1', label: 'Upload', desc: 'Drag & drop or click to select your file' },
  { num: '2', label: 'Configure', desc: 'Adjust settings to your needs' },
  { num: '3', label: 'Download', desc: 'Get your processed file instantly' },
]

export default function ToolLayout({ tool, children, faqs }: ToolLayoutProps) {
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[tool.icon] ?? Icons.Wrench
  const relatedTools = getRelatedTools(tool.id)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `DocFlow ${tool.name}`,
    description: tool.description,
    url: `https://docflow.pages.dev/${tool.slug}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }

  const faqSchema = faqs
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : undefined

  return (
    <>
      <SEOHead
        title={`${tool.name} – Free Online Tool`}
        description={tool.description}
        canonical={`/${tool.slug}`}
        keywords={tool.tags?.join(', ')}
        schema={schema}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools', url: '/tools' },
          { name: tool.name, url: `/${tool.slug}` },
        ]}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Tool header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Breadcrumb
              crumbs={[
                { label: 'Home', href: '/' },
                { label: 'Tools', href: '/tools' },
                { label: tool.name },
              ]}
            />

            <div className="mt-4 flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-primary-50 text-primary-600 rounded-xl shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">{tool.name}</h1>
                  {tool.popular && <Badge variant="blue">Popular</Badge>}
                  {tool.new && <Badge variant="green">New</Badge>}
                  <Badge variant="gray">Free</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{tool.shortDesc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tool interface */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white border border-gray-200 rounded-xl shadow-card">
            {children}
          </div>

          {/* How to use */}
          <div className="mt-10">
            <h2 className="text-lg font-bold text-gray-900 mb-5">How to use {tool.name}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {STEPS.map(step => (
                <div key={step.num} className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="w-7 h-7 flex items-center justify-center bg-primary-600 text-white rounded-full text-xs font-bold mb-3">
                    {step.num}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{step.label}</h3>
                  <p className="text-xs text-gray-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* About tool */}
          <div className="mt-10 bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-bold text-gray-900 mb-3">
              About {tool.name}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">{tool.description}</p>
          </div>

          {/* Related tools */}
          {relatedTools.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Related tools</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {relatedTools.map(t => (
                  <ToolCard key={t.id} tool={t} compact />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FAQ */}
        {faqs && faqs.length > 0 && (
          <FAQ items={faqs} title={`${tool.name} FAQ`} />
        )}
      </div>
    </>
  )
          }
          
