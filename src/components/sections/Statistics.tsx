import CountUp from '../ui/CountUp'
import Reveal from '../ui/Reveal'

const STATS = [
  { to: 30, suffix: '+', label: 'Free tools', desc: 'PDF, image, and utility tools' },
  { to: 100, suffix: '%', label: 'Browser-based', desc: 'Zero server uploads' },
  { to: 0, suffix: 'ms', label: 'Network latency', desc: 'Files never leave your device' },
  { to: 50, suffix: 'MB', label: 'Max file size', desc: 'Per file, free forever' },
]

export default function Statistics() {
  return (
    <section className="py-12 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 90} className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-primary-600 tabular-nums">
                <CountUp to={stat.to} suffix={stat.suffix} />
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-900">{stat.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.desc}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
