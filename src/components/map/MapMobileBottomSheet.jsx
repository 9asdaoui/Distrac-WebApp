import { useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * Mobile Command Center rail as a bottom sheet — map stays full bleed.
 */
export function MapMobileBottomSheet({ open, onClose, children, title = 'Panel' }) {
  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[1200] lg:hidden">
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className="absolute inset-x-0 bottom-0 flex max-h-[min(78vh,720px)] flex-col overflow-hidden rounded-t-2xl border border-zinc-700/80 bg-[#1c1c1e] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex shrink-0 items-center justify-center py-2">
          <div className="h-1 w-10 rounded-full bg-zinc-600" />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
