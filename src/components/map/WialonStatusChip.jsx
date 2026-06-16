import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Satellite } from 'lucide-react'
import apiInstance from '../../api/axiosInstance'

export function WialonStatusChip({ className = '', pulseNonce = 0, status: statusProp = undefined }) {
  const { t } = useTranslation()
  const [statusLocal, setStatusLocal] = useState(null)
  const [pulsing, setPulsing] = useState(false)

  const status = statusProp !== undefined ? statusProp : statusLocal

  useEffect(() => {
    if (statusProp !== undefined) return undefined
    let cancelled = false
    apiInstance
      .get('/wialon/status')
      .then((res) => {
        if (!cancelled) setStatusLocal(res.data?.data?.wialon || null)
      })
      .catch(() => {
        if (!cancelled) setStatusLocal(null)
      })
    return () => {
      cancelled = true
    }
  }, [statusProp])

  useEffect(() => {
    if (!pulseNonce) return undefined
    setPulsing(true)
    const timer = setTimeout(() => setPulsing(false), 1200)
    return () => clearTimeout(timer)
  }, [pulseNonce])

  if (!status) return null

  const linked = status.linkedVehicleCount ?? 0
  const running = status.running && status.configured

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2 py-1 text-[10px] font-medium text-zinc-400 ${
        pulsing ? 'animate-pulse ring-1 ring-emerald-400/40' : ''
      } ${className}`}
      title={t('commandCenter.wialonStatusTitle')}
    >
      <Satellite className={`h-3 w-3 ${running ? 'text-emerald-400' : 'text-zinc-500'}`} />
      <span className={running ? 'text-emerald-300' : 'text-zinc-500'}>
        {running ? t('commandCenter.wialonLive') : t('commandCenter.wialonIdle')}
      </span>
      <span className="text-zinc-600">·</span>
      <span>{t('commandCenter.wialonLinked', { count: linked })}</span>
    </span>
  )
}
