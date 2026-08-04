import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const TONE = {
  default: {
    panel:
      "border-l border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950",
    header: "border-b border-gray-200 dark:border-zinc-800",
    title: "text-zinc-900 dark:text-zinc-100",
    description: "text-zinc-500 dark:text-zinc-400",
    close:
      "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800",
    footer: "border-t border-gray-200 dark:border-zinc-800",
  },
  /** Command Center dark tokens — used by depot-ops notification drawer */
  cc: {
    panel: "border-l border-cc-border bg-cc-bg shadow-cc-panel",
    header: "border-b border-cc-border",
    title: "text-cc-primary",
    description: "text-cc-secondary",
    close: "text-cc-tertiary hover:bg-cc-surface-hover hover:text-cc-primary",
    footer: "border-t border-cc-border",
  },
};

export function SlideOverPanel({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  disableClose = false,
  maxWidthClass = "max-w-2xl",
  tone = "default",
}) {
  const styles = TONE[tone] || TONE.default;

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
          className="fixed inset-0 z-[1300] overflow-hidden"
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
            className={`absolute inset-y-0 right-0 flex h-[100dvh] w-full ${maxWidthClass} flex-col ${styles.panel}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className={`flex shrink-0 items-start justify-between px-6 py-4 ${styles.header}`}>
              <div className="min-w-0 pr-4">
                {title && (
                  <div
                    id="slide-over-title"
                    className={`text-xl font-semibold ${styles.title}`}
                  >
                    {title}
                  </div>
                )}
                {description && (
                  <p className={`mt-1 text-sm ${styles.description}`}>
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={disableClose}
                className={`shrink-0 rounded-lg p-1.5 disabled:opacity-40 ${styles.close}`}
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
              {children}
            </div>

            {footer ? (
              <div className={`shrink-0 px-6 py-4 ${styles.footer}`}>
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
