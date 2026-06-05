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
      flush: false,
    }
  )
}
