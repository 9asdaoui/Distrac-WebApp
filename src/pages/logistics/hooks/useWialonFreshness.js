import { useEffect, useRef, useState } from 'react'
import apiInstance from '../../../api/axiosInstance'

const WIALON_STATUS_POLL_MS = 30_000

export function useWialonFreshness({ enabled = true } = {}) {
  const [status, setStatus] = useState(null)
  const [pulseNonce, setPulseNonce] = useState(0)
  const lastSuccessAtRef = useRef(null)

  useEffect(() => {
    if (!enabled) {
      setStatus(null)
      return undefined
    }

    let cancelled = false

    const fetchStatus = async () => {
      try {
        const res = await apiInstance.get('/wialon/status')
        if (cancelled) return
        const next = res.data?.data?.wialon || null
        setStatus(next)
        const successAt = next?.lastSuccessAt || null
        if (successAt && successAt !== lastSuccessAtRef.current) {
          lastSuccessAtRef.current = successAt
          setPulseNonce((n) => n + 1)
        }
      } catch {
        if (!cancelled) setStatus(null)
      }
    }

    fetchStatus()
    const timer = setInterval(fetchStatus, WIALON_STATUS_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [enabled])

  return { wialonStatus: status, wialonPulseNonce: pulseNonce }
}
