import React, { useMemo } from 'react'

const MAX_SPEED = 140

function speedColor(speed) {
  if (speed <= 0) return '#71717a'
  if (speed < 40) return '#34d399'
  if (speed < 90) return '#fbbf24'
  return '#f87171'
}

export function SpeedGauge({ speed, size = 96 }) {
  const value = Number.isFinite(Number(speed)) ? Math.max(0, Math.min(MAX_SPEED, Number(speed))) : 0
  const angle = useMemo(() => -90 + (value / MAX_SPEED) * 180, [value])
  const stroke = speedColor(value)
  const cx = size / 2
  const cy = size * 0.62
  const radius = size * 0.36

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size * 0.72 }}>
      <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`} aria-hidden>
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#3f3f46"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(value / MAX_SPEED) * Math.PI * radius} ${Math.PI * radius}`}
        />
        <g transform={`rotate(${angle} ${cx} ${cy})`}>
          <line x1={cx} y1={cy} x2={cx} y2={cy - radius + 8} stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <circle cx={cx} cy={cy} r="4" fill="#f4f4f5" />
      </svg>
      <div className="absolute bottom-0 text-center">
        <p className="text-lg font-bold tabular-nums leading-none text-zinc-100">{Math.round(value)}</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">km/h</p>
      </div>
    </div>
  )
}
