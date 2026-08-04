import React from 'react'

export function FilterSectionLabel({ children }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
      {children}
    </p>
  )
}

export function FilterNavButton({ label, count, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all ${
        isActive
          ? 'border-zinc-800 bg-zinc-800 text-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800'
          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-cc-surface/60 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200'
      }`}
    >
      <span className="truncate pr-2">{label}</span>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
          isActive
            ? 'bg-zinc-700 text-zinc-300'
            : 'bg-zinc-100 text-zinc-500 dark:bg-cc-surface dark:text-zinc-500'
        }`}
      >
        {count}
      </span>
    </button>
  )
}
