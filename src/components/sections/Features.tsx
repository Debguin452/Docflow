import { Lock, Zap, Globe, Smartphone, CheckCircle2, RefreshCw } from 'lucide-react'

const FEATURES = [
  {
    icon: Lock,
    title: 'Completely private',
    description: 'All processing happens inside your browser. We never see, store, or transmit your files.',
  },
  {
    icon: Zap,
    title: 'Instant results',
    description: 'Tools run at native browser speed. No uploads, no waiting for server queues, no delays.',
  },
  {
    icon: Globe,
    title: 'Edge-delivered globally',
    description: 'Served from Cloudflare\'s global network. Sub-second load times from anywhere in the world.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-first design',
    description: 'Fully responsive. Works perfectly on phones, tablets, and desktops alike.',
  },
  {
    icon: CheckCircle2,
    title: 'No account needed',
    description: 'Start working immediately. No sign-up, no email, no subscription required for core tools.',
  },
  {
    icon: RefreshCw,
    title: '30+ tools in one place',
    description: 'PDF, images, QR codes, OCR — everything you need in a single, consistent interface.',
  },
]

export default function Features() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-3">
            Why DocFlow
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Built for speed and privacy
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Unlike cloud-based tools, DocFlow runs entirely in your browser.
            Your documents never leave your device.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(feature => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="p-6 bg-white border border-gray-200 rounded-xl">
                <div className="w-9 h-9 flex items-center justify-center bg-primary-50 text-primary-600 rounded-lg mb-4">
                  <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
