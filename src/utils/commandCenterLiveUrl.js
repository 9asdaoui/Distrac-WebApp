/**
 * Build Command Center live WebSocket URL from the same API base as axios.
 * @param {string} [token] - JWT; if omitted, reads localStorage
 * @returns {string|null}
 */
export function buildCommandCenterLiveUrl(token) {
  const authToken =
    token ||
    (typeof localStorage !== 'undefined'
      ? localStorage.getItem('token') || localStorage.getItem('authToken')
      : null)

  if (!authToken) return null

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'
  const wsBase = String(apiBase)
    .replace(/^https:/i, 'wss:')
    .replace(/^http:/i, 'ws:')
    .replace(/\/$/, '')

  const url = new URL(`${wsBase}/command-center/live`)
  url.searchParams.set('token', authToken)
  return url.toString()
}

export default buildCommandCenterLiveUrl
