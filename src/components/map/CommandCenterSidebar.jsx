import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronsLeftRight, House } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { UserProfileMenu } from '../UserProfileMenu'
import {
  CC_RAIL_EXPANDED_KEY,
  buildDepotManagerRailGroups,
  buildGmRailGroups,
  getAuthRoleName,
  isDepotSupervisorRole,
} from './ccPanelRegistry'

const BTN_MAX = 40
const BTN_MIN = 28
const GAP_MAX = 10
const GAP_MIN = 2
const RULE_SLOT = 10
const MAGNIFY_AMP = 0.45
const MAGNIFY_SLOTS = 2.15

function readRailExpanded() {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(CC_RAIL_EXPANDED_KEY) === 'true'
}

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function computeDensity(dockHeight, itemCount, ruleCount) {
  const count = Math.max(1, itemCount)
  const gaps = Math.max(0, count - 1)
  const available = Math.max(0, dockHeight - ruleCount * RULE_SLOT - 12)
  const fits = (btn, gap) => count * btn + gaps * gap <= available + 0.01

  let btn = BTN_MAX
  let gap = GAP_MAX

  if (!fits(btn, gap)) {
    let found = false
    for (let candidate = BTN_MAX; candidate >= BTN_MIN; candidate -= 0.5) {
      if (!fits(candidate, GAP_MIN)) continue
      let nextGap = Math.min(GAP_MAX, candidate * 0.22)
      while (nextGap > GAP_MIN && !fits(candidate, nextGap)) nextGap -= 0.5
      btn = candidate
      gap = Math.max(GAP_MIN, nextGap)
      found = true
      break
    }
    if (!found) {
      const exact = gaps > 0 ? (available - gaps * GAP_MIN) / count : available / count
      btn = Math.max(12, exact)
      gap = GAP_MIN
    }
  }

  const icon = Math.max(11, Math.round(btn * 0.46))
  return { btn, gap, icon }
}

function clearDockScales(itemEls) {
  itemEls.forEach((el) => {
    if (!el) return
    el.style.transform = ''
    el.style.zIndex = ''
    el.style.willChange = ''
  })
}

/**
 * Command Center left sidebar — navigation only (Home + modules + profile).
 * Map layer visibility lives under the legend filter control.
 */
export function CommandCenterSidebar({
  hudOffsetClass = '',
  activePanel = null,
  onPanelChange,
}) {
  const { t } = useTranslation()
  const { hasPermission, user } = useAuth()
  const dockRef = useRef(null)
  const itemRefs = useRef(new Map())
  const rafRef = useRef(0)
  const [expanded, setExpanded] = useState(readRailExpanded)
  const [density, setDensity] = useState({ btn: BTN_MAX, gap: GAP_MAX, icon: 18 })

  const isDepotManager = isDepotSupervisorRole(user)
  const panelGroups = isDepotManager
    ? buildDepotManagerRailGroups(hasPermission, { user })
    : buildGmRailGroups(hasPermission, { user })

  const homeActive = !activePanel
  const dockItemCount = 1 + panelGroups.reduce((sum, group) => sum + group.length, 0)
  const dockRuleCount = panelGroups.length > 0 ? panelGroups.length : 0
  const profileActive = activePanel === 'profile'
  const profileLabel = t('profile.accountSettings', { defaultValue: 'Account Settings' })
  const homeLabel = t('commandCenter.layers.home', { defaultValue: 'Home' })
  const profileName = user?.full_name || user?.fullName || user?.name || 'User'
  const avatarUrl = user?.avatar_url || user?.avatarUrl || null
  const avatarInitials = (() => {
    const parts = String(profileName).trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return 'U'
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  })()

  const setItemRef = useCallback((key, node) => {
    if (node) itemRefs.current.set(key, node)
    else itemRefs.current.delete(key)
  }, [])

  const recalcDensity = useCallback(() => {
    const el = dockRef.current
    if (!el) return
    const next = computeDensity(el.clientHeight, dockItemCount, dockRuleCount)
    setDensity((prev) =>
      prev.btn === next.btn && prev.gap === next.gap && prev.icon === next.icon ? prev : next,
    )
  }, [dockItemCount, dockRuleCount])

  useEffect(() => {
    const el = dockRef.current
    if (!el || typeof ResizeObserver === 'undefined') {
      recalcDensity()
      return undefined
    }
    const ro = new ResizeObserver(() => recalcDensity())
    ro.observe(el)
    recalcDensity()
    return () => ro.disconnect()
  }, [recalcDensity, expanded])

  useEffect(() => {
    if (expanded) clearDockScales(itemRefs.current)
  }, [expanded])

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    },
    [],
  )

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev
      localStorage.setItem(CC_RAIL_EXPANDED_KEY, next ? 'true' : 'false')
      return next
    })
  }

  const applyDockMagnify = useCallback(
    (clientY) => {
      if (expanded || prefersReducedMotion()) {
        clearDockScales(itemRefs.current)
        return
      }
      const influence = Math.max(density.btn * MAGNIFY_SLOTS, 36)
      let hottest = null
      let hottestScale = 1

      itemRefs.current.forEach((el) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        const cy = rect.top + rect.height / 2
        const dist = Math.abs(clientY - cy)
        const scale = 1 + MAGNIFY_AMP * Math.max(0, 1 - dist / influence)
        el.style.willChange = 'transform'
        el.style.transform = `scale(${scale.toFixed(3)})`
        el.style.zIndex = String(Math.round(scale * 20))
        if (scale > hottestScale) {
          hottestScale = scale
          hottest = el
        }
      })

      if (hottest) hottest.style.zIndex = '40'
    },
    [density.btn, expanded],
  )

  const onDockPointerMove = (e) => {
    if (expanded || e.pointerType === 'touch') return
    const y = e.clientY
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => applyDockMagnify(y))
  }

  const onDockPointerLeave = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    clearDockScales(itemRefs.current)
  }

  const onDockItemFocus = (key) => {
    if (expanded || prefersReducedMotion()) return
    itemRefs.current.forEach((el, k) => {
      if (!el) return
      if (k === key) {
        el.style.willChange = 'transform'
        el.style.transform = 'scale(1.18)'
        el.style.zIndex = '40'
      } else {
        el.style.transform = ''
        el.style.zIndex = ''
        el.style.willChange = ''
      }
    })
  }

  const onDockItemBlur = () => {
    if (expanded) return
    const dock = dockRef.current
    if (!dock?.matches(':hover')) clearDockScales(itemRefs.current)
  }

  const expandTooltip = expanded
    ? t('sidebar.hide', { defaultValue: 'Collapse' })
    : t('sidebar.show', { defaultValue: 'Expand' })

  const dockStyle = useMemo(
    () => ({
      '--cc-sidebar-btn': `${density.btn}px`,
      '--cc-sidebar-gap': `${density.gap}px`,
      '--cc-sidebar-icon': `${density.icon}px`,
    }),
    [density],
  )

  return (
    <div
      className={`pointer-events-none absolute bottom-4 left-4 top-4 z-[1000] flex flex-col items-start overflow-visible ${hudOffsetClass}`}
    >
      <aside
        className={`cc-sidebar pointer-events-auto${expanded ? ' cc-sidebar--expanded' : ''}`}
        aria-label="Command Center navigation"
      >
        <div className="cc-sidebar__title">
          <button
            type="button"
            className={`cc-sidebar__btn cc-sidebar__btn--menu${expanded ? ' cc-sidebar__btn--expanded' : ''}`}
            aria-label={expandTooltip}
            aria-pressed={expanded}
            data-tooltip={expanded ? undefined : expandTooltip}
            title={expandTooltip}
            onClick={toggleExpanded}
          >
            <span className="cc-sidebar__glyph">
              <ChevronsLeftRight className="cc-sidebar__icon cc-sidebar__menu-icon" strokeWidth={2} />
            </span>
          </button>
        </div>

        <div className="cc-sidebar__rule cc-sidebar__rule--pinned" aria-hidden />

        <div
          ref={dockRef}
          className={`cc-sidebar__dock${expanded ? '' : ' cc-sidebar__dock--magnify'}`}
          style={dockStyle}
          role="presentation"
          onPointerMove={onDockPointerMove}
          onPointerLeave={onDockPointerLeave}
        >
          <div className="cc-sidebar__icons" role="navigation" aria-label="Home">
            <button
              ref={(node) => setItemRef('nav:home', node)}
              type="button"
              aria-label={homeLabel}
              aria-current={homeActive ? 'page' : undefined}
              data-tooltip={expanded ? undefined : homeLabel}
              onClick={() => onPanelChange?.(null)}
              onFocus={() => onDockItemFocus('nav:home')}
              onBlur={onDockItemBlur}
              className={`cc-sidebar__btn${homeActive ? ' cc-sidebar__btn--active' : ''}`}
            >
              <span className="cc-sidebar__glyph">
                <House className="cc-sidebar__icon" strokeWidth={2} />
              </span>
              <span className="cc-sidebar__label">{homeLabel}</span>
            </button>
          </div>

          {panelGroups.map((group, groupIndex) => (
            <React.Fragment key={`nav-group-${groupIndex}`}>
              <div className="cc-sidebar__rule cc-sidebar__rule--dock" aria-hidden />
              <div className="cc-sidebar__icons" role="navigation" aria-label="Modules">
                {group.map((item) => {
                  const Icon = item.icon
                  const label = item.labelKey
                    ? t(item.labelKey, { defaultValue: item.label })
                    : item.label
                  const active = activePanel === item.key
                  const key = `panel:${item.key}`
                  return (
                    <button
                      key={key}
                      ref={(node) => setItemRef(key, node)}
                      type="button"
                      aria-label={label}
                      aria-current={active ? 'page' : undefined}
                      data-tooltip={expanded ? undefined : label}
                      onClick={() => onPanelChange?.(item.key)}
                      onFocus={() => onDockItemFocus(key)}
                      onBlur={onDockItemBlur}
                      className={`cc-sidebar__btn${active ? ' cc-sidebar__btn--active' : ''}`}
                    >
                      <span className="cc-sidebar__glyph">
                        <Icon className="cc-sidebar__icon" strokeWidth={2} />
                      </span>
                      <span className="cc-sidebar__label">{label}</span>
                    </button>
                  )
                })}
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="cc-sidebar__rule cc-sidebar__rule--pinned" aria-hidden />

        <div className="cc-sidebar__footer">
          <UserProfileMenu
            trigger="settings"
            placement="up"
            roleLabel={getAuthRoleName(user) || ''}
            className="cc-sidebar__settings-wrap"
            showTooltip={!expanded}
          />
          <button
            type="button"
            aria-label={profileLabel}
            aria-pressed={profileActive}
            data-tooltip={expanded ? undefined : profileLabel}
            title={profileLabel}
            onClick={() => onPanelChange?.('profile')}
            className={`cc-sidebar__btn cc-sidebar__btn--profile${profileActive ? ' cc-sidebar__btn--active' : ''}`}
          >
            <span className="cc-sidebar__glyph">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="cc-sidebar__avatar" />
              ) : (
                <span className="cc-sidebar__avatar cc-sidebar__avatar--fallback" aria-hidden>
                  {avatarInitials}
                </span>
              )}
            </span>
            <span className="cc-sidebar__label">{profileLabel}</span>
          </button>
        </div>
      </aside>
    </div>
  )
}

export default CommandCenterSidebar
