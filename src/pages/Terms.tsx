import SEOHead from '../components/ui/SEOHead'
import Breadcrumb from '../components/ui/Breadcrumb'

const LAST_UPDATED = 'January 15, 2024'

export default function Terms() {
  return (
    <>
      <SEOHead
        title="Terms of Service — DocFlow"
        description="DocFlow terms of service. Free to use for personal and commercial purposes. No warranty on processing results."
        canonical="/terms"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Terms of Service' }]} />

        <div className="mt-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {LAST_UPDATED}</p>

          {[
            {
              title: '1. Acceptance of Terms',
              body: 'By using DocFlow ("the Service"), you agree to these Terms of Service. If you do not agree, do not use the Service. These terms apply to all users.',
            },
            {
              title: '2. Description of Service',
              body: 'DocFlow provides free, browser-based document and image processing tools including PDF compression, merging, splitting, image conversion, OCR, and QR code generation. All processing is performed locally in your browser. We provide the tools "as is" with no guarantee of specific results.',
            },
            {
              title: '3. Permitted Use',
              body: `You may use DocFlow for personal, commercial, or educational purposes at no cost. You agree not to:
• Use the Service for any unlawful purpose
• Attempt to reverse-engineer, scrape, or extract the application in ways that circumvent normal browser use
• Use automated bots to generate excessive API requests that impair service for other users
• Upload files that violate applicable laws (e.g., child exploitation material, materials infringing copyright you do not own)`,
            },
            {
              title: '4. Your Files and Content',
              body: 'All file processing occurs locally in your browser. We do not receive, view, store, or have access to any files you process. You retain all rights to your files. You are solely responsible for ensuring you have the right to process any documents or images using this service.',
            },
            {
              title: '5. Disclaimer of Warranties',
              body: 'THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT: (a) THE SERVICE WILL MEET YOUR REQUIREMENTS; (b) RESULTS WILL BE ACCURATE OR RELIABLE; (c) THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE. Use the Service to process important documents at your own risk. Always keep copies of original files.',
            },
            {
              title: '6. Limitation of Liability',
              body: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, DOCFLOW AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE, INCLUDING LOSS OF DATA OR DOCUMENTS. Our total liability for any claim shall not exceed $0 (as the Service is provided free of charge).',
            },
            {
              title: '7. Availability',
              body: 'We aim to keep DocFlow available but make no uptime guarantees. We may modify, suspend, or discontinue any feature or the entire Service at any time without notice.',
            },
            {
              title: '8. Intellectual Property',
              body: 'DocFlow\'s source code is open source (MIT License). The DocFlow name and logo are not licensed for use by third parties without permission. Third-party libraries used by DocFlow are subject to their own licenses (pdf-lib: MIT, Tesseract.js: Apache 2.0, etc.).',
            },
            {
              title: '9. Governing Law',
              body: 'These terms are governed by the laws of the jurisdiction in which the service operator is located, without regard to conflict of law principles.',
            },
            {
              title: '10. Changes to Terms',
              body: 'We may update these terms at any time. Continued use of the Service after changes constitutes acceptance. The "Last updated" date at the top of this page reflects the most recent revision.',
            },
            {
              title: '11. Contact',
              body: 'Questions about these terms: legal@docflow.pages.dev',
            },
          ].map(section => (
            <div key={section.title} className="mb-7">
              <h2 className="text-base font-bold text-gray-900 mb-2">{section.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
