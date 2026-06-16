import React from 'react'

export function MapPopupShell({ children, className = '' }) {
  return (
    <div
      className={`min-w-[240px] max-w-[280px] overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900/95 p-0 text-zinc-100 shadow-2xl backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  )
}
