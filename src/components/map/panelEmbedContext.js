import { createContext, useContext } from 'react'

export const PanelEmbedContext = createContext(false)

export function usePanelEmbed() {
  return useContext(PanelEmbedContext)
}
