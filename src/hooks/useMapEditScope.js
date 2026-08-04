import { useEffect, useMemo, useState } from 'react'
import apiInstance from '../api/axiosInstance'
import { useAuth } from '../context/AuthContext'
import { isDepotSupervisorRole } from '../components/map/ccPanelRegistry'

function roleNameOf(user) {
  const raw = user?.role?.name || user?.role || ''
  return String(raw).toUpperCase()
}

/**
 * Resolve depot-manager map edit scope from assignments.
 */
export function useMapEditScope() {
  const { user } = useAuth()
  const isDepotManager = isDepotSupervisorRole(user)
  const [scope, setScope] = useState({ depotIds: new Set(), sectorIds: new Set(), loaded: false })

  useEffect(() => {
    if (!isDepotManager || !user) {
      setScope({ depotIds: new Set(), sectorIds: new Set(), loaded: true })
      return undefined
    }

    let cancelled = false

    const load = async () => {
      try {
        const res = await apiInstance.get('/assignments/my-assignments')
        const grouped = res.data?.data?.grouped || {}
        const depotIds = new Set((grouped.depots || []).map((row) => row.entity_id))
        const sectorIds = new Set((grouped.sectors || []).map((row) => row.entity_id))

        const sectorsRes = await apiInstance.get('/sectors')
        for (const sector of sectorsRes.data?.data?.sectors || []) {
          if (sector.id) sectorIds.add(sector.id)
        }

        if (!cancelled) {
          setScope({ depotIds, sectorIds, loaded: true })
        }
      } catch {
        if (!cancelled) {
          setScope({ depotIds: new Set(), sectorIds: new Set(), loaded: true })
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [isDepotManager, user])

  const canEditMapEntity = useMemo(() => {
    return (entityType, entityOrDetails) => {
      if (!entityType || !entityOrDetails) return false
      if (!isDepotManager) return true

      const type = String(entityType).toLowerCase()
      const id = entityOrDetails.id

      if (type === 'industry' || type === 'region' || type === 'sector') return false

      if (type === 'depot') {
        return scope.depotIds.has(id)
      }

      if (type === 'vehicle') {
        const depotId = entityOrDetails.depot_id || entityOrDetails.depotId
        return depotId && scope.depotIds.has(depotId)
      }

      if (type === 'client') {
        const sectorId = entityOrDetails.sector_id || entityOrDetails.sectorId
        return sectorId && scope.sectorIds.has(sectorId)
      }

      return false
    }
  }, [isDepotManager, scope])

  const canCreateMapEntity = useMemo(() => {
    if (!isDepotManager) return true
    return false
  }, [isDepotManager])

  const canUpdateClientCredit = useMemo(() => {
    return (client) => {
      if (!client) return false
      if (!isDepotManager) return true
      const sectorId = client.sector_id || client.sectorId
      return sectorId && scope.sectorIds.has(sectorId)
    }
  }, [isDepotManager, scope])

  return {
    isDepotManager,
    roleName: roleNameOf(user),
    scopeLoaded: scope.loaded,
    canEditMapEntity,
    canCreateMapEntity,
    canUpdateClientCredit,
    scopedDepotIds: scope.depotIds,
    scopedSectorIds: scope.sectorIds,
  }
}
