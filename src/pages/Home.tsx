import Hero from '../components/sections/Hero'
import ToolCategories from '../components/sections/ToolCategories'
import PopularTools from '../components/sections/PopularTools'
import Statistics from '../components/sections/Statistics'
import Features from '../components/sections/Features'
import BlogPreview from '../components/sections/BlogPreview'
import FAQ from '../components/sections/FAQ'
import CTA from '../components/sections/CTA'
import SEOHead from '../components/ui/SEOHead'
import { HOMEPAGE_FAQ } from '../data/faq'

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'DocFlow',
  url: 'https://docflow.pages.dev',
  description:
    'Free online PDF and image tools. Compress, merge, split, convert — all in your browser.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://docflow.pages.dev/tools?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: HOMEPAGE_FAQ.map(f => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
}

export default function Home() {
  return (
    <>
      <SEOHead
        title="DocFlow – Free PDF & Image Tools Online"
        description="Free online tools for PDF compression, merging, splitting, image conversion, background removal, OCR and more. No signup required. Files processed locally in your browser."
        canonical="/"
        keywords="pdf compress, merge pdf, split pdf, image converter, background remover, ocr, free online tools"
        schema={SCHEMA}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      <Hero />
      <ToolCategories />
      <PopularTools />
      <Statistics />
      <Features />
      <BlogPreview />
      <FAQ items={HOMEPAGE_FAQ} />
      <CTA />
    </>
  )
}
