/**
 * Lightweight pub/sub for map-level events that should not force full page re-renders.
 */

const listeners = new Map()

function getSet(event) {
  if (!listeners.has(event)) listeners.set(event, new Set())
  return listeners.get(event)
}

export function subscribeMapEvent(event, handler) {
  const set = getSet(event)
  set.add(handler)
  return () => set.delete(handler)
}

export function emitMapEvent(event, payload) {
  const set = listeners.get(event)
  if (!set?.size) return
  for (const handler of set) {
    try {
      handler(payload)
    } catch (err) {
      console.warn(`[mapEventBus] handler failed for ${event}:`, err)
    }
  }
}

export const MAP_EVENTS = {
  VEHICLE_POSITION: 'vehicle:position',
  SELECTION_CHANGED: 'selection:changed',
}
