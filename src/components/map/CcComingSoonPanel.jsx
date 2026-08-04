import React from 'react'

/**
 * Empty placeholder for depot-rail panels not built yet (Shipments).
 */
export function CcComingSoonPanel({ title = 'Coming soon' }) {
  return (
    <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <p className="text-base font-semibold text-cc-primary">{title}</p>
      <p className="max-w-sm text-sm text-cc-tertiary">This module is not available yet.</p>
    </div>
  )
}

export function ShipmentsComingSoon() {
  return <CcComingSoonPanel title="Shipments" />
}

export default CcComingSoonPanel
