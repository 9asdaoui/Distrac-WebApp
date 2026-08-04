/**
 * Command Center theme — re-exports central design tokens for map / rail consumers.
 */
import { CC_COLORS } from '../../styles/designTokens'

export const CC_ACCENT = CC_COLORS.accent
export const CC_ACCENT_SOFT = CC_COLORS.accentHover
export const CC_BG = CC_COLORS.bgApp
export const CC_SURFACE = CC_COLORS.bgSurface
export const CC_BORDER = CC_COLORS.borderSubtle

/** Tailwind-friendly accent classes for rails / forms. */
export const CC_ACCENT_TEXT = 'text-cc-accent'
export const CC_ACCENT_TEXT_HOVER = 'hover:text-cc-accent-hover'
export const CC_ICON_ACCENT = 'text-cc-accent-hover bg-cc-accent/15 ring-cc-accent/25'
