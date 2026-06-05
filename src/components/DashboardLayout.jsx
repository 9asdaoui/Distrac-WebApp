import React from 'react'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Menu, X } from 'lucide-react'
import { SidebarLayoutProvider } from '../context/SidebarLayoutContext'
import { Sidebar } from './Sidebar'

const SIDEBAR_VISIBLE_KEY = 'distrac.sidebar.visible'
export const SIDEBAR_WIDTH_CLASS = 'w-64'
export const SIDEBAR_TRANSITION =
  'duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:duration-0'

function readSidebarVisible() {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(SIDEBAR_VISIBLE_KEY) !== 'false'
}

export function DashboardLayout({ children, flush = false }) {
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [desktopSidebarVisible, setDesktopSidebarVisible] = React.useState(readSidebarVisible)

  const hideDesktopSidebar = React.useCallback(() => {
    setDesktopSidebarVisible(false)
    localStorage.setItem(SIDEBAR_VISIBLE_KEY, 'false')
  }, [])

  const showDesktopSidebar = React.useCallback(() => {
    setDesktopSidebarVisible(true)
    localStorage.setItem(SIDEBAR_VISIBLE_KEY, 'true')
  }, [])

  const toggleDesktopSidebar = React.useCallback(() => {
    setDesktopSidebarVisible((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_VISIBLE_KEY, next ? 'true' : 'false')
      return next
    })
  }, [])

  const sidebarLayoutValue = React.useMemo(
    () => ({
      desktopSidebarVisible,
      showDesktopSidebar,
      hideDesktopSidebar,
      toggleDesktopSidebar,
      flush,
    }),
    [desktopSidebarVisible, showDesktopSidebar, hideDesktopSidebar, toggleDesktopSidebar, flush],
  )

  return (
    <SidebarLayoutProvider value={sidebarLayoutValue}>
      <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-900">
        {/* Desktop sidebar — slide with transform (smoother than width animation) */}
        <aside
          className={`fixed inset-y-0 left-0 hidden ${SIDEBAR_WIDTH_CLASS} flex-col border-r border-zinc-200 bg-white transition-transform will-change-transform md:flex dark:border-zinc-800 dark:bg-zinc-950 ${SIDEBAR_TRANSITION} ${
            flush ? 'z-[1050]' : 'z-30'
          } ${
            desktopSidebarVisible
              ? `translate-x-0 ${flush ? 'shadow-2xl shadow-black/40' : 'shadow-none'}`
              : '-translate-x-full pointer-events-none shadow-none'
          }`}
          aria-hidden={!desktopSidebarVisible}
        >
          <Sidebar onCollapse={hideDesktopSidebar} />
        </aside>

        {/* Desktop expand rail — single reopen control when sidebar is hidden */}
        {!desktopSidebarVisible && (
          <button
            type="button"
            onClick={showDesktopSidebar}
            className={`fixed left-0 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-r-xl border border-l-0 py-5 pl-0.5 pr-1 shadow-md backdrop-blur-sm md:flex ${flush ? 'z-[1060]' : 'z-40'} ${SIDEBAR_TRANSITION} ${
              flush
                ? 'border-zinc-700/90 bg-zinc-900/95 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                : 'border-zinc-200/90 bg-white/95 text-zinc-500 hover:bg-white hover:text-zinc-900 dark:border-zinc-700/90 dark:bg-zinc-950/95 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
            aria-label={t('sidebar.show')}
            title={t('sidebar.show')}
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        )}

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <div className={`relative z-10 h-full ${SIDEBAR_WIDTH_CLASS}`}>
              <Sidebar
                onNavigate={() => setSidebarOpen(false)}
                onCollapse={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        <div
          className={`flex min-w-0 flex-1 flex-col md:ml-0 ${
            flush
              ? ''
              : `transition-[margin] will-change-[margin] ${SIDEBAR_TRANSITION} ${
                  desktopSidebarVisible ? 'md:ml-64' : 'md:ml-0'
                }`
          }`}
        >
          <div className="flex h-16 shrink-0 items-center border-b border-zinc-200 bg-white px-4 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="rounded-xl border border-zinc-200 p-2 text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" strokeWidth={1.75} />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={1.75} />
              )}
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
    </SidebarLayoutProvider>
  )
}
