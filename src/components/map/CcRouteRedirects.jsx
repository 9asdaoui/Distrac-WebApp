import React from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import {
  buildGlobalMapEntityHref,
  buildGlobalMapPanelHref,
  legacyGlobalMapSearchToPath,
  MAP_LAYER_LIST_REDIRECTS,
} from './ccPanelRegistry'

/** @deprecated Prefer direct paths; kept for stray imports */
export function MapLayerListRedirect({ layer }) {
  return <Navigate to={buildGlobalMapPanelHref(layer)} replace />
}

export function CcPanelListRedirect({ panel }) {
  return <Navigate to={buildGlobalMapPanelHref(panel)} replace />
}

export function CcPanelDetailRedirect({ panel, focus = null }) {
  const params = useParams()
  const id = params.id || params.productId || params.requestId
  const resolvedFocus = focus || (params.requestId ? 'request' : null)
  return <Navigate to={buildGlobalMapPanelHref(panel, id, resolvedFocus)} replace />
}

export function MapEntityDetailRedirect({ type }) {
  const { id } = useParams()
  return <Navigate to={buildGlobalMapEntityHref(type, id)} replace />
}

export function LegacyQueryPanelRedirect() {
  const location = useLocation()
  const to = legacyGlobalMapSearchToPath(new URLSearchParams(location.search))
  return <Navigate to={to} replace />
}

export function mapLayerRedirectElement(path) {
  const layer = MAP_LAYER_LIST_REDIRECTS[path]
  if (!layer) return null
  return <MapLayerListRedirect layer={layer} />
}
