import React from 'react'
import { UserRound } from 'lucide-react'

export function DriverAvatar({ livreur, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'h-10 w-10' : 'h-12 w-12'
  const iconClass = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6'

  if (livreur?.avatar_url) {
    return (
      <img
        src={livreur.avatar_url}
        alt={livreur.full_name || 'Driver'}
        className={`${sizeClass} shrink-0 rounded-full object-cover ring-2 ring-zinc-700`}
      />
    )
  }

  return (
    <span
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-zinc-800 ring-2 ring-zinc-700`}
    >
      <UserRound className={`${iconClass} text-zinc-500`} strokeWidth={1.75} />
    </span>
  )
}
