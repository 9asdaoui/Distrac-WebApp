import React from 'react'
import { MapPin } from 'lucide-react'

export function LocationMapEmpty({ message = 'No GPS coordinates set for this location.' }) {
  return (
    <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 dark:border-zinc-700 dark:bg-zinc-900/50">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <MapPin className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
      </div>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{message}</p>
    </div>
  )
}
