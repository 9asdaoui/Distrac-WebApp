import { useCallback, useEffect, useRef, useState } from 'react'
import apiInstance from '../../../api/axiosInstance'
import { dedupeById, normalizeDepotForMap } from './mapUtils'

const REFRESH_DEBOUNCE_MS = 300

export function useMapData(mapLayerFilter) {
  const controllerRef = useRef(null)
  const refreshTimerRef = useRef(null)
  const [sectors, setSectors] = useState([])
  const [depots, setDepots] = useState([])
  const [industries, setIndustries] = useState([])
  const [regions, setRegions] = useState([])
  const [clients, setClients] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const refreshMapDataNow = useCallback(async () => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    setLoadError('')

    try {
      const [sectorsRes, depotsRes, industriesRes, regionsRes, vehiclesRes] = await Promise.all([
        apiInstance.get('/sectors', { signal: controller.signal }),
        apiInstance.get('/depots', { signal: controller.signal }),
        apiInstance.get('/industries', { signal: controller.signal }),
        apiInstance.get('/regions', { signal: controller.signal }),
        apiInstance.get('/logistics/vehicles', { signal: controller.signal }),
      ])

      if (controller.signal.aborted) return

      setSectors(sectorsRes.data?.data?.sectors || [])
      setDepots(
        dedupeById((depotsRes.data?.data?.depots || []).map(normalizeDepotForMap).filter(Boolean)),
      )
      setIndustries(industriesRes.data?.data?.industries || [])
      setRegions(regionsRes.data?.data?.regions || [])
      setVehicles(vehiclesRes.data?.data?.vehicles || [])
    } catch (error) {
      if (error.name === 'CanceledError' || controller.signal.aborted) return
      setLoadError(error.response?.data?.message || error.message || 'Failed to load map data')
      setSectors([])
      setDepots([])
      setIndustries([])
      setRegions([])
      setVehicles([])
      setClients([])
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }, [])

  const refreshMapData = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    refreshTimerRef.current = setTimeout(() => {
      refreshMapDataNow()
    }, REFRESH_DEBOUNCE_MS)
  }, [refreshMapDataNow])

  useEffect(() => {
    refreshMapDataNow()
    return () => {
      controllerRef.current?.abort()
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [refreshMapDataNow])

  return {
    sectors,
    depots,
    industries,
    regions,
    clients,
    vehicles,
    isLoading,
    loadError,
    refreshMapData,
    refreshMapDataNow,
    setClients,
    setRegions,
    setVehicles,
    setSectors,
  }
}
