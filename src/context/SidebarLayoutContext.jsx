import React from 'react'

const SidebarLayoutContext = React.createContext(null)

export function SidebarLayoutProvider({ value, children }) {
  return (
    <SidebarLayoutContext.Provider value={value}>{children}</SidebarLayoutContext.Provider>
  )
}

export function useSidebarLayout() {
  const ctx = React.useContext(SidebarLayoutContext)
  return (
    ctx ?? {
      desktopSidebarVisible: true,
      showDesktopSidebar: () => {},
      hideDesktopSidebar: () => {},
      toggleDesktopSidebar: () => {},
      toggleSidebar: () => {},
      flush: false,
    }
  )
}

/** Slide map HUD controls clear of the overlay sidebar without resizing the map. */
const MAP_HUD_SIDEBAR_TRANSITION =
  'duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:duration-0'

export function useMapHudOffsetClass() {
  const { desktopSidebarVisible, flush } = useSidebarLayout()
  if (!flush) return ''
  return `will-change-transform transition-transform ${MAP_HUD_SIDEBAR_TRANSITION} ${
    desktopSidebarVisible ? 'md:translate-x-64' : 'md:translate-x-0'
  }`
}
