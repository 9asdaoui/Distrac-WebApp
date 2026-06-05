import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function SlideOverPanel({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  disableClose = false,
  maxWidthClass = "max-w-2xl",
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const main = document.querySelector("main");
    const previousMainOverflow = main?.style.overflow ?? "";

    document.body.style.overflow = "hidden";
    if (main) main.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      if (main) main.style.overflow = previousMainOverflow;
    };
  }, [isOpen]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "slide-over-title" : undefined}
          className="fixed inset-0 z-[60] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !disableClose && onClose()}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className={`absolute inset-y-0 right-0 flex h-[100dvh] w-full ${maxWidthClass} flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex shrink-0 items-start justify-between border-b border-gray-200 px-6 py-4 dark:border-zinc-800">
              <div className="min-w-0 pr-4">
                {title && (
                  <div
                    id="slide-over-title"
                    className="text-xl font-semibold text-zinc-900 dark:text-zinc-100"
                  >
                    {title}
                  </div>
                )}
                {description && (
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={disableClose}
                className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-40 dark:hover:bg-zinc-800"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
              {children}
            </div>

            {footer ? (
              <div className="shrink-0 border-t border-gray-200 px-6 py-4 dark:border-zinc-800">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
