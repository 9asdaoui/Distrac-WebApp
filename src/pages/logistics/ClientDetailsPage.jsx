import React, { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Phone, User } from 'lucide-react'
import { AnimatedPage } from '../../components/AnimatedPage'
import { LocationMapCard } from '../../components/LocationMap'
import apiInstance from '../../api/axiosInstance'

function DetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
      <div className="h-64 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
    </div>
  )
}

export function ClientDetailsPage() {
  const { id } = useParams()
  const controllerRef = useRef(null)
  const [client, setClient] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const res = await apiInstance.get(`/clients/${id}`, { signal: controller.signal })
        if (!controller.signal.aborted) {
          setClient(res.data?.data?.client || null)
        }
      } catch (err) {
        if (err.name === 'CanceledError' || controller.signal.aborted) return
        setError(err.response?.data?.message || 'Client not found')
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
      <div className="space-y-6">
        <div>
          <Link
            to="/global-map"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Global Map
          </Link>

          {isLoading ? (
            <DetailsSkeleton />
          ) : error || !client ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {error || 'Client not found'}
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  <User className="h-6 w-6 text-zinc-600 dark:text-zinc-300" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {client.client_name || 'Client'}
                  </h1>
                  {client.place_name && (
                    <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{client.place_name}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {client.phone && (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                      <Phone className="h-3.5 w-3.5" />
                      Phone
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{client.phone}</p>
                  </div>
                )}
                {client.sector_id && (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                      <MapPin className="h-3.5 w-3.5" />
                      Sector
                    </p>
                    <Link
                      to={`/sectors/${client.sector_id}`}
                      className="mt-1 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      View sector
                    </Link>
                  </div>
                )}
              </div>

              {(client.client_address || client.city) && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {[client.client_address, client.city].filter(Boolean).join(', ')}
                </p>
              )}

              <LocationMapCard
                lat={client.gps_latitude}
                lng={client.gps_longitude}
                name={client.client_name}
                emptyMessage="No GPS coordinates for this client."
              />
            </>
          )}
        </div>
      </div>
    </AnimatedPage>
  )
}
