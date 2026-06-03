/**
 * One-off helper: replace legacy zinc primary button classes with btn-primary utilities.
 * Safe to re-run (skips files already using btn-primary).
 */
const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, '../src')

const REPLACEMENTS = [
  [
    'inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300',
    'btn-primary',
  ],
  [
    'rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300',
    'btn-primary',
  ],
  [
    'inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300',
    'btn-primary',
  ],
  [
    'inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900',
    'btn-primary',
  ],
  [
    'flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200',
    'btn-primary btn-primary-block disabled:cursor-not-allowed disabled:opacity-60',
  ],
  [
    'flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900',
    'btn-primary-flex disabled:opacity-40',
  ],
  [
    'flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200',
    'btn-primary-flex disabled:opacity-40',
  ],
  [
    'inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900',
    'btn-primary-flex disabled:opacity-50',
  ],
  [
    'inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900',
    'btn-primary flex-1 rounded-xl py-3 disabled:opacity-50',
  ],
  [
    'inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900',
    'btn-primary rounded-xl py-3 disabled:opacity-40',
  ],
  [
    'w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200',
    'btn-primary btn-primary-block rounded-xl py-3 disabled:opacity-40',
  ],
  [
    'flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300',
    'btn-primary flex-1 disabled:opacity-60',
  ],
  [
    'inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900',
    'btn-primary flex-1 disabled:opacity-50',
  ],
  [
    'inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300',
    'btn-primary disabled:cursor-not-allowed disabled:opacity-60',
  ],
  [
    'rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900',
    'btn-primary px-3 py-2 text-xs',
  ],
  [
    'inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900',
    'btn-primary px-3 py-2 text-xs disabled:opacity-50',
  ],
  [
    'inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900',
    'btn-primary px-3 py-2 disabled:opacity-40',
  ],
  [
    'flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900',
    'btn-primary flex-1 disabled:opacity-60',
  ],
  [
    'mt-3 w-full rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700',
    'btn-primary mt-3 w-full px-3 py-2 text-xs',
  ],
]

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (entry.name.endsWith('.jsx') && entry.name !== 'Sidebar.jsx') files.push(full)
  }
  return files
}

let total = 0
for (const file of walk(SRC)) {
  let content = fs.readFileSync(file, 'utf8')
  let changed = false
  for (const [from, to] of REPLACEMENTS) {
    if (content.includes(from)) {
      content = content.split(from).join(to)
      changed = true
      total += 1
    }
  }
  if (changed) fs.writeFileSync(file, content, 'utf8')
}

console.log(`Applied ${total} replacement(s) across src/**/*.jsx`)
