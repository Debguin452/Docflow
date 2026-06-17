import SEOHead from '../components/ui/SEOHead'
import Breadcrumb from '../components/ui/Breadcrumb'

const LAST_UPDATED = 'January 15, 2024'

export default function Privacy() {
  return (
    <>
      <SEOHead
        title="Privacy Policy — DocFlow"
        description="DocFlow's privacy policy. All file processing is done locally in your browser. We collect no personal data and store no files."
        canonical="/privacy"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]} />

        <div className="mt-8 prose-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {LAST_UPDATED}</p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-8">
            <p className="text-sm font-semibold text-emerald-800">
              Short version: We don't collect your files, your personal data, or anything else about you. All document and image processing happens in your browser.
            </p>
          </div>

          {[
            {
              title: '1. Information We Do Not Collect',
              body: `DocFlow does not collect, store, transmit, or process any files you upload into its tools. All PDF and image processing operations execute entirely within your web browser using JavaScript and WebAssembly. Your documents never leave your device.

We do not collect:
• The contents of any documents or images you process
• Your name, email address, or any other personal identifiers
• Your IP address (other than what is inherent in HTTP connections to our CDN)
• Browser fingerprints or device identifiers
• Location data`,
            },
            {
              title: '2. Analytics Data We Do Collect',
              body: `We collect minimal, anonymous analytics to understand which tools are used most often. Specifically:

• Which tool was used (e.g., "pdf-compress") and approximately when
• Nothing else

This data is collected as aggregate counts (e.g., "pdf-compress was used 142 times today") stored in Cloudflare KV. It contains no information that could identify you or be linked back to any individual.

Events are batched in your browser's sessionStorage and sent as a group when you leave the page — not on every individual action.`,
            },
            {
              title: '3. Cookies and Local Storage',
              body: `DocFlow uses sessionStorage (not cookies) to batch analytics events before sending. This data is cleared when you close your browser tab.

We use IndexedDB to cache large WebAssembly model files (for background removal and OCR) so they don't need to be re-downloaded each visit. These are model weights only — no user data is stored in IndexedDB.

No third-party cookies are set. We do not use advertising cookies, tracking pixels, or any cross-site tracking technology.`,
            },
            {
              title: '4. Third-Party Services',
              body: `DocFlow is hosted on Cloudflare Pages. When you visit DocFlow, your browser connects to Cloudflare's servers to receive the application files. Cloudflare may log connection metadata (IP address, timestamp, requested URL) as part of normal CDN operation. See Cloudflare's privacy policy at cloudflare.com/privacypolicy.

We use Google Fonts (Inter) for typography. Your browser will request font files from Google's CDN. See Google's privacy policy at policies.google.com/privacy.

We do not integrate with any advertising networks, social media trackers, or analytics services (Google Analytics, Mixpanel, etc.).`,
            },
            {
              title: '5. Data Retention',
              body: `Since we collect no personal data, there is nothing to retain or delete on your behalf.

Anonymous tool usage counts are retained indefinitely as aggregate statistics (e.g., "pdf-compress: 14,200 uses"). This information cannot be linked to any individual.

Cloudflare's CDN access logs are retained per Cloudflare's standard retention policy (typically 30 days).`,
            },
            {
              title: '6. Children\'s Privacy',
              body: `DocFlow is a general-purpose utility service with no features targeted at children. We do not knowingly collect information from children under 13 (or under 16 in the EU). Since we collect no personal information from any user, this policy applies equally to all users regardless of age.`,
            },
            {
              title: '7. Changes to This Policy',
              body: `We may update this privacy policy to reflect changes in our practices or for legal/regulatory reasons. When we do, we will update the "Last updated" date at the top of this page. Continued use of DocFlow after changes constitutes acceptance of the updated policy.`,
            },
            {
              title: '8. Contact',
              body: `If you have questions about this privacy policy, contact us at privacy@docflow.pages.dev.`,
            },
          ].map(section => (
            <div key={section.title} className="mb-8">
              <h2 className="text-base font-bold text-gray-900 mb-3">{section.title}</h2>
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {section.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
