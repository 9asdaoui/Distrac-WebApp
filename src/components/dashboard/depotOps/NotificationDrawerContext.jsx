import React, { createContext, useContext } from 'react'

const NotificationDrawerContext = createContext({
  openNotificationDrawer: () => {},
})

export function NotificationDrawerProvider({ value, children }) {
  return (
    <NotificationDrawerContext.Provider value={value}>
      {children}
    </NotificationDrawerContext.Provider>
  )
}

export function useNotificationDrawer() {
  return useContext(NotificationDrawerContext)
}

export default NotificationDrawerContext
