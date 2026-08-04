import React, { useMemo } from 'react'
import { Route, Routes } from 'react-router-dom'
import {
  getCcPanel,
  hasCcPanelPermission,
  panelDetailRoutePattern,
  resolvePanelSyntheticPath,
} from './ccPanelRegistry'
import { PanelEmbedContext } from './panelEmbedContext'

export { usePanelEmbed } from './panelEmbedContext'

/**
 * Mounts a registry list/detail page inside the CC right rail.
 * Uses <Routes location> with the real module path so useParams works while the
 * map shell stays mounted.
 */
export function CcPanelHost({ panelKey, id, focus, hasPermission }) {
  const entry = getCcPanel(panelKey)

  const location = useMemo(() => {
    if (!entry) return null
    const pathname = resolvePanelSyntheticPath(entry, id, focus)
    // List-only panels (e.g. exceptions) have no Detail route — pass id via ?id=
    // so the list page can deep-link/select the row (timeline / approval nav).
    const needsQueryId = Boolean(id && !entry.Detail && !entry.RequestDetail)
    const search = needsQueryId ? `?id=${encodeURIComponent(String(id))}` : ''
    return {
      pathname,
      search,
      hash: '',
      state: null,
      key: `cc-panel-${panelKey}-${id || 'list'}-${focus || ''}`,
    }
  }, [entry, panelKey, id, focus])

  if (!entry) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-cc-tertiary">
        Unknown panel
      </div>
    )
  }

  if (!hasCcPanelPermission(hasPermission, entry.requiredPermission)) {
    return null
  }

  const showDetail = Boolean(id && (entry.Detail || entry.RequestDetail))
  const DetailComponent =
    entry.key === 'stock' && focus === 'request'
      ? entry.RequestDetail
      : entry.Detail
  const ListComponent = entry.List

  return (
    <PanelEmbedContext.Provider value={true}>
      <div className="cc-panel-host h-full min-h-0 overflow-auto bg-cc-bg text-cc-primary">
        {/* Synthetic location keeps useParams working; remounts list↔detail only (map shell stays up). */}
        <Routes location={location} key={location.key}>
          {showDetail && DetailComponent ? (
            <Route
              path={panelDetailRoutePattern(entry, focus)}
              element={<DetailComponent />}
            />
          ) : (
            <Route path="*" element={<ListComponent />} />
          )}
        </Routes>
      </div>
    </PanelEmbedContext.Provider>
  )
}

export default CcPanelHost
