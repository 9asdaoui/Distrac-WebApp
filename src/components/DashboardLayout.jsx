import React from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarLayoutProvider } from '../context/SidebarLayoutContext'
import { usePanelEmbed } from './map/CcPanelHost'

export const SIDEBAR_WIDTH_CLASS = 'w-64'
export const SIDEBAR_TRANSITION =
  'duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:duration-0'

/**
 * App chrome. Wide sidebar removed — Command Center icon rail is the nav.
 * When embedded in the CC panel, render children only (pages that self-wrap layout).
 */
export function DashboardLayout({ children, flush = false }) {
  const embedded = usePanelEmbed()

  const sidebarLayoutValue = React.useMemo(
    () => ({
      desktopSidebarVisible: false,
      showDesktopSidebar: () => {},
      hideDesktopSidebar: () => {},
      toggleDesktopSidebar: () => {},
      toggleSidebar: () => {},
      flush,
    }),
    [flush],
  )

  if (embedded) {
    return children ?? <Outlet />
  }

  return (
    <SidebarLayoutProvider value={sidebarLayoutValue}>
      <div
        className={`flex h-screen overflow-hidden ${
          flush ? 'bg-cc-bg' : 'bg-zinc-50 dark:bg-cc-bg'
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <main
            className={
              flush
                ? 'relative min-h-0 flex-1 overflow-hidden bg-cc-bg'
                : 'min-h-0 flex-1 overflow-auto bg-zinc-50 p-4 md:p-8 dark:bg-cc-bg'
            }
          >
            {children ?? <Outlet />}
          </main>
        </div>
      </div>
    </SidebarLayoutProvider>
  )
}
