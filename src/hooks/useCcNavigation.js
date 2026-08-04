import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  buildGlobalMapEntityHref,
  buildGlobalMapPanelHref,
} from '../components/map/ccPanelRegistry'

/**
 * Canonical in-app Command Center navigation — real top-level paths.
 * Defaults to history push so browser Back works.
 */
export function useCcNavigation() {
  const navigate = useNavigate()

  const openPanel = useCallback(
    (panel, id = null, focus = null, options = {}) => {
      const { replace = false, ...rest } = options
      navigate(buildGlobalMapPanelHref(panel, id, focus), {
        replace,
        ...rest,
      })
    },
    [navigate],
  )

  const clearPanel = useCallback(
    (options = {}) => {
      const { replace = false, ...rest } = options
      navigate(buildGlobalMapPanelHref(null), {
        replace,
        ...rest,
      })
    },
    [navigate],
  )

  const openMapEntity = useCallback(
    (type, id, options = {}) => {
      if (!type || id == null) return
      const { tab, focus, replace = false, ...rest } = options
      navigate(buildGlobalMapEntityHref(type, id, { tab, focus }), {
        replace,
        ...rest,
      })
    },
    [navigate],
  )

  return { openPanel, clearPanel, openMapEntity, navigate }
}
