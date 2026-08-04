/**
 * Command Center design tokens — single source of truth for JS / Tailwind.
 * Values extracted from the homepage / Command Center UI (no new visuals).
 */

/** @type {const} */
export const CC_COLORS = {
  bgApp: '#0b0e14',
  bgSurface: '#12161e',
  bgSurfaceAlt: '#0f131a',
  bgSurfaceHover: '#1a2030',
  borderSubtle: '#1e2430',
  borderDefault: '#2a3140',
  borderHover: '#3a4458',
  textPrimary: '#e8edf5',
  textSecondary: '#c8d0dc',
  textMuted: '#9aa3b2',
  textTertiary: '#7a8494',
  accent: '#ff6b00',
  accentHover: '#e55f00',
  accentSoftBg: 'rgba(255, 107, 0, 0.12)',
  accentSoftBorder: 'rgba(255, 107, 0, 0.25)',
  info: '#4a90e2',
  infoHover: '#6aa8f0',
  success: '#30a46c',
  successHover: '#3dbb7a',
  warning: '#f5a524',
  warningHover: '#ffb224',
  error: '#e5484d',
  errorHover: '#ff6369',
  teal: '#14b8a6',
  tealHover: '#2dd4bf',
  violet: '#8b5cf6',
  violetHover: '#a78bfa',
  routeBg: '#38bdf8',
  routeFocus: '#60a5fa',
  mapCanvas: '#0c0c0e',
  statusPending: '#4a90e2',
  statusPendingBg: 'rgba(74, 144, 226, 0.16)',
  statusDelayed: '#f5a524',
  statusDelayedBg: 'rgba(245, 165, 36, 0.16)',
  statusCollected: '#30a46c',
  statusCollectedBg: 'rgba(48, 164, 108, 0.12)',
  rowSelectedBg: 'rgba(74, 144, 226, 0.10)',
}

/** @type {const} */
export const CC_TYPOGRAPHY = {
  fontFamily: "'Manrope', 'Segoe UI', sans-serif",
  sizeLabel: '10px',
  sizeCaption: '11px',
  sizeBodySm: '12px',
  sizeBody: '13px',
  sizeKpi: '28px',
  trackingLabel: '0.06em',
  trackingSection: '0.08em',
}

/** @type {const} */
export const CC_RADIUS = {
  control: '0.5rem', // rounded-lg
  panel: '12px',
  pill: '9999px',
}

/** @type {const} */
export const CC_SHADOWS = {
  subtle: '0 1px 0 rgba(255,255,255,0.02)',
  panel: '0 12px 32px rgba(0,0,0,0.45)',
  dropdown: '0 8px 24px rgba(0,0,0,0.35)',
  tooltip: '0 6px 18px rgba(0,0,0,0.4)',
  glass: '0 8px 28px rgba(0,0,0,0.45)',
  hud: '0 4px 24px rgba(0,0,0,0.5)',
}

/** CSS custom property names (mirror index.css). */
export const CC_CSS_VARS = {
  bgApp: '--color-bg-app',
  bgSurface: '--color-bg-surface',
  bgSurfaceAlt: '--color-bg-surface-alt',
  bgSurfaceHover: '--color-bg-surface-hover',
  borderSubtle: '--color-border-subtle',
  borderDefault: '--color-border-default',
  borderHover: '--color-border-hover',
  textPrimary: '--color-text-primary',
  textSecondary: '--color-text-secondary',
  textMuted: '--color-text-muted',
  textTertiary: '--color-text-tertiary',
  accent: '--color-accent',
  accentHover: '--color-accent-hover',
  accentSoftBg: '--color-accent-soft-bg',
  accentSoftBorder: '--color-accent-soft-border',
  success: '--color-success',
  warning: '--color-warning',
  error: '--color-error',
  info: '--color-info',
  routeBg: '--color-route-bg',
  routeFocus: '--color-route-focus',
  statusPending: '--status-pending',
  statusPendingBg: '--status-pending-bg',
  statusDelayed: '--status-delayed',
  statusDelayedBg: '--status-delayed-bg',
  statusCollected: '--status-collected',
  statusCollectedBg: '--status-collected-bg',
  rowSelectedBg: '--row-selected-bg',
}

/** Tailwind-friendly class bundles used across CC chrome. */
export const CC_PANEL_SURFACE =
  'rounded-cc-panel border border-cc-border-subtle bg-cc-surface-alt shadow-cc-subtle'
export const CC_CONTROL_SURFACE =
  'rounded-cc-control border border-cc-border bg-cc-surface text-cc-body text-cc-primary'
export const CC_HUD_GLASS =
  'map-hud-surface border border-cc-border-subtle bg-cc-surface/95 backdrop-blur-[10px]'
