import React from 'react'
import { Building2, Calendar, Factory, Package, User, Warehouse } from 'lucide-react'

function hashHue(value) {
  const text = String(value || '')
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

function sizeClasses(size) {
  if (size === 'xs') return { box: 'h-8 w-8 rounded-lg text-[10px]', icon: 'h-3.5 w-3.5' }
  if (size === 'sm') return { box: 'h-10 w-10 rounded-lg text-xs', icon: 'h-4 w-4' }
  if (size === 'lg') return { box: 'h-16 w-16 rounded-xl text-lg', icon: 'h-7 w-7' }
  if (size === 'xl') return { box: 'h-20 w-20 rounded-xl text-xl', icon: 'h-8 w-8' }
  return { box: 'h-12 w-12 rounded-xl text-sm', icon: 'h-5 w-5' }
}

export function ProductThumb({ product, size = 'md', className = '' }) {
  const { box, icon } = sizeClasses(size)
  if (product?.image_url) {
    return (
      <img
        src={product.image_url}
        alt=""
        className={`shrink-0 object-cover ${box} ${className}`}
      />
    )
  }
  return (
    <div className={`flex shrink-0 items-center justify-center bg-zinc-100 text-zinc-500 dark:bg-zinc-800 ${box} ${className}`}>
      <Package className={icon} />
    </div>
  )
}

export function IndustryAvatar({ industry, name, size = 'md', showName = true, className = '' }) {
  const label = name || industry?.industry_name || 'Industry'
  const { box } = sizeClasses(size)
  const initials = label
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'
  const hue = hashHue(label)

  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      <div
        className={`flex shrink-0 items-center justify-center font-semibold text-white shadow-sm ${box}`}
        style={{ backgroundColor: `hsl(${hue}, 48%, 42%)` }}
        title={label}
      >
        {initials}
      </div>
      {showName && (
        <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</span>
      )}
    </div>
  )
}

export function MetaTile({ icon: Icon, label, value, accent = 'zinc' }) {
  const accents = {
    zinc: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
  }[accent] || accents.zinc

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-cc-surface">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${accents}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value || '—'}</p>
    </div>
  )
}

export function QuantityBadge({ label, value }) {
  return (
    <span className="inline-flex flex-col rounded-lg bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800">
      <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</span>
    </span>
  )
}

export function ProductThumbStrip({ items, max = 5, size = 'sm' }) {
  const visible = (items || []).slice(0, max)
  const overflow = Math.max((items || []).length - max, 0)

  if (visible.length === 0) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <Package className="h-4 w-4 text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="flex items-center">
      {visible.map((item, index) => (
        <ProductThumb
          key={item.id || item.product_id || index}
          product={item.product}
          size={size}
          className={index > 0 ? '-ml-2 ring-2 ring-white dark:ring-zinc-900' : ''}
        />
      ))}
      {overflow > 0 && (
        <span className="-ml-2 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-200 text-xs font-semibold text-zinc-600 ring-2 ring-white dark:bg-zinc-700 dark:text-zinc-200 dark:ring-zinc-900">
          +{overflow}
        </span>
      )}
    </div>
  )
}

export function uniqueIndustriesFromItems(items = []) {
  const map = new Map()
  for (const item of items) {
    const industry = item.industry
    const id = item.industry_id || industry?.id
    if (!id && !industry?.industry_name) continue
    const key = id || industry.industry_name
    if (!map.has(key)) {
      map.set(key, industry || { id, industry_name: 'Unknown industry' })
    }
  }
  return [...map.values()]
}

export { Building2, Calendar, Factory, User, Warehouse }
