import { CC_COLORS, CC_RADIUS, CC_SHADOWS, CC_TYPOGRAPHY } from './src/styles/designTokens.js'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        distrac: {
          primary: '#ff6b00',
          hover: '#e55f00',
          active: '#cc5400',
          light: '#fff3eb',
          muted: 'rgba(255,107,0,0.12)',
          ring: 'rgba(255,107,0,0.35)',
        },
        cc: {
          bg: CC_COLORS.bgApp,
          surface: CC_COLORS.bgSurface,
          'surface-alt': CC_COLORS.bgSurfaceAlt,
          'surface-hover': CC_COLORS.bgSurfaceHover,
          'border-subtle': CC_COLORS.borderSubtle,
          border: CC_COLORS.borderDefault,
          'border-hover': CC_COLORS.borderHover,
          primary: CC_COLORS.textPrimary,
          secondary: CC_COLORS.textSecondary,
          muted: CC_COLORS.textMuted,
          tertiary: CC_COLORS.textTertiary,
          accent: CC_COLORS.accent,
          'accent-hover': CC_COLORS.accentHover,
          info: CC_COLORS.info,
          'info-hover': CC_COLORS.infoHover,
          success: CC_COLORS.success,
          'success-hover': CC_COLORS.successHover,
          warning: CC_COLORS.warning,
          'warning-hover': CC_COLORS.warningHover,
          error: CC_COLORS.error,
          'error-hover': CC_COLORS.errorHover,
          teal: CC_COLORS.teal,
          'teal-hover': CC_COLORS.tealHover,
          violet: CC_COLORS.violet,
          'violet-hover': CC_COLORS.violetHover,
          'route-bg': CC_COLORS.routeBg,
          'route-focus': CC_COLORS.routeFocus,
          canvas: CC_COLORS.mapCanvas,
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'cc-label': [CC_TYPOGRAPHY.sizeLabel, { lineHeight: '1.2' }],
        'cc-caption': [CC_TYPOGRAPHY.sizeCaption, { lineHeight: '1.2' }],
        'cc-body-sm': [CC_TYPOGRAPHY.sizeBodySm, { lineHeight: '1.4' }],
        'cc-body': [CC_TYPOGRAPHY.sizeBody, { lineHeight: '1.4' }],
        'cc-kpi': [CC_TYPOGRAPHY.sizeKpi, { lineHeight: '1.1' }],
      },
      letterSpacing: {
        'cc-label': CC_TYPOGRAPHY.trackingLabel,
        'cc-section': CC_TYPOGRAPHY.trackingSection,
      },
      borderRadius: {
        'cc-control': CC_RADIUS.control,
        'cc-panel': CC_RADIUS.panel,
        'cc-pill': CC_RADIUS.pill,
      },
      boxShadow: {
        'cc-subtle': CC_SHADOWS.subtle,
        'cc-panel': CC_SHADOWS.panel,
        'cc-dropdown': CC_SHADOWS.dropdown,
        'cc-tooltip': CC_SHADOWS.tooltip,
        'cc-glass': CC_SHADOWS.glass,
        'cc-hud': CC_SHADOWS.hud,
      },
    },
  },
  plugins: [],
}
