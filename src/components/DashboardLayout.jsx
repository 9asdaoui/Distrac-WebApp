import React from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function DashboardLayout({ children, flush = false }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full w-64">
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center border-b border-zinc-200 bg-white px-4 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="rounded-lg border border-zinc-200 p-2 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <main
          className={
            flush
              ? 'relative min-h-0 flex-1 overflow-hidden bg-zinc-950'
              : 'min-h-0 flex-1 overflow-auto bg-zinc-50 p-4 md:p-8 dark:bg-zinc-900'
          }
        >
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}
