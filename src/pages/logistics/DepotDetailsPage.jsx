import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatedPage } from '../../components/AnimatedPage'
import { DepotDetailsContent } from '../../components/logistics/DepotDetailsContent'
import apiInstance from '../../api/axiosInstance'

export function DepotDetailsPage() {
  const { id } = useParams()
  const [depot, setDepot] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const controllerRef = useRef(null)

  useEffect(() => {
    if (!id) return undefined

    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const res = await apiInstance.get(`/depots/${id}`, { signal: controller.signal })
        if (!controller.signal.aborted) {
          setDepot(res.data?.data?.depot || null)
        }
      } catch (err) {
        if (err.name !== 'CanceledError' && !controller.signal.aborted) {
          setDepot(null)
          setError(err?.response?.data?.message || 'Failed to load depot details.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    load()
    return () => controllerRef.current?.abort()
  }, [id])

  return (
    <AnimatedPage>
      <div className="mx-auto max-w-7xl space-y-8 p-8">
        <DepotDetailsContent depot={depot} isLoading={isLoading} error={error} layout="page" showMap />
      </div>
    </AnimatedPage>
  )
}
