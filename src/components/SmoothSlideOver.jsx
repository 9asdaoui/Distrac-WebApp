import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

/**
 * Full-height right slide-over with sticky footer.
 * Portaled to document.body so it is not clipped by map rail overflow,
 * which previously left a large empty/dimmed gap beside a short form.
 */
export function SmoothSlideOver({ isOpen, onClose, title, description, children, footer }) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1300] overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute inset-y-0 right-0 flex h-[100dvh] w-full max-w-2xl flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex shrink-0 items-start justify-between border-b border-gray-200 px-6 py-4 dark:border-zinc-800">
              <div className="min-w-0 pr-4">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
                {description && (
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-6 py-4">
              {children}
            </div>

            {footer ? (
              <div className="shrink-0 border-t border-gray-200 px-6 py-4 dark:border-zinc-800">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
