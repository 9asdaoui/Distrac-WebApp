import React, { Fragment } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDown, Globe, LogOut, Moon, Settings, Sun, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { PERMISSIONS } from '../config/permissions'
import { buildGlobalMapPanelHref } from './map/ccPanelRegistry'

function avatarInitials(name = '') {
  const parts = String(name).trim().split(' ').filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function itemClass(active) {
  return `flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-[7px] text-left transition-colors duration-150 ${
    active ? 'bg-cc-surface-hover text-cc-primary' : 'text-cc-secondary'
  }`
}

const SUPPORTED_LANGUAGES = ['en', 'fr', 'ar']

/**
 * Command Center account menu — theme, language, settings, sign out.
 * @param {'avatar'|'settings'} trigger — avatar chip (default) or sidebar settings icon
 */
export function UserProfileMenu({
  placement = 'down',
  roleLabel = '',
  className = '',
  trigger = 'avatar',
  showTooltip = true,
}) {
  const { user, logout, hasPermission } = useAuth()
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme } = useTheme()

  const name = user?.full_name || user?.fullName || user?.name || 'User'
  const email = user?.email || '-'
  const avatarUrl = user?.avatar_url || user?.avatarUrl || null
  const initials = avatarInitials(name)
  const opensUp = placement === 'up'
  const isSettingsTrigger = trigger === 'settings'
  const canManageSettings = hasPermission?.(PERMISSIONS.MANAGE_SETTINGS)
  const settingsLabel = t('commandCenter.settingsMenu', { defaultValue: 'Settings' })

  const menuAlign = isSettingsTrigger
    ? '' // position via .cc-profile-menu--settings relative to .cc-sidebar
    : opensUp
      ? 'bottom-full right-0 mb-1.5 origin-bottom-right'
      : 'right-0 top-full mt-1.5 origin-top-right'

  return (
    <Menu as="div" className={`relative ${className}`}>
      {({ open }) => (
        <>
          {isSettingsTrigger && open && typeof document !== 'undefined'
            ? createPortal(
                <div className="cc-sidebar__settings-backdrop" aria-hidden />,
                document.body,
              )
            : null}
          {isSettingsTrigger ? (
            <Menu.Button
              type="button"
              className={`cc-sidebar__btn cc-sidebar__btn--settings${open ? ' cc-sidebar__btn--settings-open' : ''}`}
              aria-label={settingsLabel}
              data-tooltip={showTooltip ? settingsLabel : undefined}
              title={settingsLabel}
            >
              <span className="cc-sidebar__glyph">
                <Settings className="cc-sidebar__icon" strokeWidth={2} />
              </span>
              <span className="cc-sidebar__label">{settingsLabel}</span>
            </Menu.Button>
          ) : (
            <Menu.Button
              className={`flex h-9 shrink-0 items-center gap-2 rounded-lg border pl-1 pr-2 transition duration-200 ${
                open
                  ? 'border-cc-border bg-cc-surface'
                  : 'border-transparent hover:border-cc-border hover:bg-cc-surface'
              }`}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-cc-accent text-[10px] font-semibold text-white">
                  {initials}
                  <span className="absolute -bottom-px -right-px block h-2 w-2 rounded-full border-2 border-cc-bg bg-emerald-500" />
                </span>
              )}
              <span className="hidden min-w-0 text-left lg:block">
                <span className="block max-w-[120px] truncate text-[12px] font-semibold leading-tight text-cc-primary">
                  {name}
                </span>
                <span className="block max-w-[120px] truncate text-[10px] leading-tight text-cc-tertiary">
                  {roleLabel || email}
                </span>
              </span>
              <ChevronDown
                className={`hidden h-3.5 w-3.5 text-cc-tertiary transition duration-200 ease-out lg:block ${
                  open ? 'rotate-180' : ''
                }`}
              />
            </Menu.Button>
          )}

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom={`opacity-0 scale-[0.96] ${opensUp || isSettingsTrigger ? 'translate-y-1' : '-translate-y-1'}`}
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 scale-100 translate-y-0"
            leaveTo={`opacity-0 scale-[0.96] ${opensUp || isSettingsTrigger ? 'translate-y-1' : '-translate-y-1'}`}
          >
            <Menu.Items
              className={`cc-profile-menu map-hud-surface absolute overflow-hidden border border-cc-border bg-cc-surface outline-none focus:outline-none ${
                isSettingsTrigger
                  ? 'cc-profile-menu--settings'
                  : `z-40 w-[220px] ${menuAlign}`
              }`}
            >
              <div className="px-2.5 pb-2 pt-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="relative shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cc-accent text-[11px] font-semibold text-white">
                        {initials}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full border-2 border-cc-surface bg-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold leading-snug text-cc-primary">
                      {name}
                    </p>
                    <p className="truncate text-[10px] leading-snug text-cc-tertiary">
                      {roleLabel || email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mx-2.5 h-px bg-cc-border-subtle" />

              <div className="space-y-0.5 p-1.5">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        toggleTheme()
                      }}
                      className={itemClass(active)}
                    >
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-cc-primary">{t('profile.theme')}</p>
                        <p className="text-[10px] text-cc-tertiary">
                          {theme === 'dark' ? t('profile.dark') : t('profile.light')}
                        </p>
                      </div>
                      {theme === 'dark' ? (
                        <Sun className="h-3.5 w-3.5 shrink-0 text-cc-tertiary" />
                      ) : (
                        <Moon className="h-3.5 w-3.5 shrink-0 text-cc-tertiary" />
                      )}
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() => {
                        const currentIndex = SUPPORTED_LANGUAGES.indexOf(i18n.language)
                        const nextLanguage =
                          SUPPORTED_LANGUAGES[(currentIndex + 1 + SUPPORTED_LANGUAGES.length) % SUPPORTED_LANGUAGES.length]
                        localStorage.setItem('lang', nextLanguage)
                        i18n.changeLanguage(nextLanguage)
                      }}
                      className={itemClass(active)}
                    >
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-cc-primary">{t('profile.language')}</p>
                        <p className="text-[10px] uppercase text-cc-tertiary">{i18n.language}</p>
                      </div>
                      <Globe className="h-3.5 w-3.5 shrink-0 text-cc-tertiary" />
                    </button>
                  )}
                </Menu.Item>
              </div>

              <div className="mx-2.5 h-px bg-cc-border-subtle" />

              <div className="space-y-0.5 p-1.5">
                {canManageSettings ? (
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to={buildGlobalMapPanelHref('settings')}
                        className={itemClass(active)}
                      >
                        <span className="text-[12px] font-medium text-cc-primary">
                          {t('sidebar.systemSettings', { defaultValue: 'System Settings' })}
                        </span>
                        <Settings className="h-3.5 w-3.5 shrink-0 text-cc-tertiary" />
                      </Link>
                    )}
                  </Menu.Item>
                ) : null}

                <Menu.Item>
                  {({ active }) => (
                    <Link to={buildGlobalMapPanelHref('profile')} className={itemClass(active)}>
                      <span className="text-[12px] font-medium text-cc-primary">
                        {t('profile.accountSettings')}
                      </span>
                      <UserRound className="h-3.5 w-3.5 shrink-0 text-cc-tertiary" />
                    </Link>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={logout}
                      className={`flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-[7px] text-left transition-colors duration-150 ${
                        active ? 'bg-[#e5484d]/12 text-[#ff6369]' : 'text-[#ff6369]'
                      }`}
                    >
                      <span className="text-[12px] font-medium">{t('profile.signOut')}</span>
                      <LogOut className="h-3.5 w-3.5 shrink-0" />
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  )
}

export default UserProfileMenu
