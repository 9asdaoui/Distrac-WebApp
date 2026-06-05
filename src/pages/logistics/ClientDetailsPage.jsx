import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatedPage } from '../../components/AnimatedPage'
import { ClientDetailsContent } from '../../components/logistics/ClientDetailsContent'
import apiInstance from '../../api/axiosInstance'

export function ClientDetailsPage() {
  const { id } = useParams()
  const controllerRef = useRef(null)
  const [client, setClient] = useState(null)
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return undefined
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const [clientRes, ordersRes] = await Promise.all([
          apiInstance.get(`/clients/${id}`, { signal: controller.signal }),
          apiInstance
            .get(`/clients/${id}/orders`, { signal: controller.signal })
            .catch(() => ({ data: { data: { orders: [] } } })),
        ])
        if (!controller.signal.aborted) {
          setClient(clientRes.data?.data?.client || null)
          setOrders(ordersRes.data?.data?.orders || [])
        }
      } catch (err) {
        if (err.name === 'CanceledError' || controller.signal.aborted) return
        setError(err.response?.data?.message || 'Failed to load client details.')
        setClient(null)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [id])

  return (
    <AnimatedPage>
      <div className="mx-auto max-w-7xl space-y-8">
        <ClientDetailsContent
          client={client}
          orders={orders}
          isLoading={isLoading}
          error={error}
          layout="page"
          showMap
          onClientUpdate={(updated) => setClient((prev) => (prev ? { ...prev, ...updated } : updated))}
        />
      </div>
    </AnimatedPage>
  )
}
