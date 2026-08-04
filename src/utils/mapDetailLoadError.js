/**
 * Friendly message for sector/region (and other map) detail fetch failures.
 * Prefer API message; map MAP_VIEW_FORBIDDEN / 403 to a clear access denial.
 */
export function mapDetailLoadError(err, fallback = 'Failed to load details.') {
  const status = err?.response?.status
  const code = err?.response?.data?.code
  const message = err?.response?.data?.message

  if (code === 'MAP_VIEW_FORBIDDEN' || status === 403) {
    return message || 'You do not have access to this item.'
  }

  return message || fallback
}
