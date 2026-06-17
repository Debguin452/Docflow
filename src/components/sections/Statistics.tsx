const STATS = [
  { value: '30+', label: 'Free tools', desc: 'PDF, image, and utility tools' },
  { value: '100%', label: 'Browser-based', desc: 'Zero server uploads' },
  { value: '0ms', label: 'Network latency', desc: 'Files never leave your device' },
  { value: '50MB', label: 'Max file size', desc: 'Per file, free forever' },
]

export default function Statistics() {
  return (
    <section className="py-12 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {STATS.map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-primary-600 tabular-nums">
                {stat.value}
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-900">{stat.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
