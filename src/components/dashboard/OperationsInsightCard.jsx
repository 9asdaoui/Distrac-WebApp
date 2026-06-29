import React from 'react'

export function OperationsInsightCard({ title, children, className = '', accentClass = '' }) {
  return (
    <section
      className={`rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 ${accentClass} ${className}`}
    >
      {title ? (
        <h3 className="mb-3 text-sm font-semibold text-zinc-100">{title}</h3>
      ) : null}
      {children}
    </section>
  )
}

export function SectionSkeleton({ lines = 3 }) {
  return (
    <div className="animate-pulse space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="h-3 w-32 rounded bg-zinc-800" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-8 w-full rounded-lg bg-zinc-800/80" />
      ))}
    </div>
  )
}
