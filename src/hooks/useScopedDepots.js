import { useEffect, useState } from 'react'
import apiInstance from '../api/axiosInstance'
import { useAuth } from '../context/AuthContext'

const GLOBAL_STOCK_ROLES = new Set(['GENERAL_MANAGEMENT', 'SUPERVISOR'])

export function useScopedDepots() {
  const { user } = useAuth()
  const [depots, setDepots] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const depotsRes = await apiInstance.get('/depots')
        const allDepots = depotsRes.data?.data?.depots || []
        const role = user?.role

        if (GLOBAL_STOCK_ROLES.has(role)) {
          if (!cancelled) setDepots(allDepots)
          return
        }

        try {
          const assignRes = await apiInstance.get('/assignments/my-assignments')
          const assigned = assignRes.data?.data?.grouped?.depots || []
          const allowedIds = new Set(assigned.map((row) => row.entity_id))
          const scoped = allDepots.filter((depot) => allowedIds.has(depot.id))
          // Non-global roles: empty assignments → empty list (not all system depots)
          if (!cancelled) setDepots(scoped)
        } catch {
          if (!cancelled) setDepots([])
        }
      } catch (err) {
        if (!cancelled) {
          setDepots([])
          setError(err.response?.data?.message || 'Failed to load depots')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    if (user) load()
    return () => {
      cancelled = true
    }
  }, [user])

  return { depots, isLoading, error }
}
