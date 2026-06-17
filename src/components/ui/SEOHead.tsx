import { Helmet } from 'react-helmet-async'
import type { SEOProps } from '../../types'

const SITE_NAME = 'DocFlow'
const SITE_URL = 'https://docflow.pages.dev'

interface Props extends SEOProps {
  breadcrumbs?: Array<{ name: string; url: string }>
}

export default function SEOHead({ title, description, canonical, keywords, schema, breadcrumbs }: Props) {
  const fullTitle = title.includes('DocFlow') ? title : `${title} | ${SITE_NAME}`
  const url = canonical ? `${SITE_URL}${canonical}` : SITE_URL

  const breadcrumbSchema = breadcrumbs
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: `${SITE_URL}${item.url}`,
        })),
      }
    : null

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />

      {/* Schema */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
    </Helmet>
  )
}
