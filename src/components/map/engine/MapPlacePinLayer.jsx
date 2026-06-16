import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

/**
 * Crosshair reticle for click-to-place pin during create flows.
 */
export function MapPlacePinLayer({ enabled, onPlace, hint = 'Click map to set location' }) {
  const map = useMap()

  useEffect(() => {
    if (!enabled || !map) return undefined

    const container = map.getContainer()
    container.classList.add('global-map--placing-pin')

    const onClick = (e) => {
      L.DomEvent.stop(e)
      const { lat, lng } = e.latlng
      onPlace?.({ lat, lng })
    }

    map.on('click', onClick)

    return () => {
      map.off('click', onClick)
      container.classList.remove('global-map--placing-pin')
    }
  }, [map, enabled, onPlace])

  if (!enabled) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center">
      <div className="relative h-12 w-12">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-rose-400/70" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-rose-400/70" />
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-rose-400 bg-rose-500/30 ring-4 ring-rose-500/20" />
      </div>
      {hint ? (
        <p className="absolute bottom-8 left-1/2 max-w-xs -translate-x-1/2 rounded-full border border-rose-500/30 bg-zinc-950/85 px-3 py-1 text-center text-[11px] text-rose-200 backdrop-blur-sm">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
