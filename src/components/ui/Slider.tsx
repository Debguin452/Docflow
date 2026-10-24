import clsx from 'clsx'

interface SliderProps {
  label?: string
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  displayValue?: string
  className?: string
}

export default function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  displayValue,
  className,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className={clsx('w-full', className)}>
      {(label || displayValue !== undefined) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {displayValue !== undefined && (
            <span className="text-sm font-semibold text-primary-600 tabular-nums">
              {displayValue}
            </span>
          )}
        </div>
      )}
      <div className="relative h-4 flex items-center">
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 rounded-full transition-all duration-75"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer"
          aria-label={label}
        />
        <div
          className="absolute w-4 h-4 bg-white border-2 border-primary-600 rounded-full shadow-sm pointer-events-none transition-all duration-75"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
    </div>
  )
}
