import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu } from '@headlessui/react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Globe,
  HelpCircle,
  LogOut,
  Moon,
  PanelLeftClose,
  Settings,
  Sun,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getMenuConfig } from '../config/menuConfig'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
const avatarInitials = (name = '') => {
  const parts = String(name).trim().split(' ').filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function isSidebarItemActive(item, pathname) {
  const basePath = item.path.split('?')[0]
  if (basePath === '/global-map') {
    return pathname === '/global-map'
  }
  return pathname === basePath || pathname.startsWith(`${basePath}/`)
}

export function Sidebar({ onNavigate, onCollapse }) {
  const location = useLocation()
  const { user, hasPermission, logout } = useAuth()
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme } = useTheme()

  const canAccess = (permission) => {
    if (!permission) return true
    if (Array.isArray(permission)) {
      return permission.some((perm) => hasPermission(perm))
    }
    return hasPermission(permission)
  }

  const menuGroups = getMenuConfig()
    .map((group) => ({
      ...group,
      items: (group.items || [])
        .map((item) => {
          if (!item.children?.length) {
            return canAccess(item.requiredPermission) ? item : null
          }

          const children = item.children.filter((child) => canAccess(child.requiredPermission))
          const parentAllowed = canAccess(item.requiredPermission)
          if (!parentAllowed && children.length === 0) return null
          return { ...item, children }
        })
        .filter(Boolean),
    }))
    .filter((group) => group.items.length > 0)

  const [expandedPaths, setExpandedPaths] = useState(() => new Set())

  useEffect(() => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      for (const group of menuGroups) {
        for (const item of group.items) {
          if (!item.children?.length) continue
          const onGlobalMap = location.pathname === '/global-map'
          const childActive = item.children.some((child) =>
            isSidebarItemActive(child, location.pathname),
          )
          if (onGlobalMap || childActive) {
            next.add(item.path)
          }
        }
      }
      return next
    })
  }, [location.pathname, menuGroups])

  const toggleExpanded = (path) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('lang', lng)
  }

  const supportAndSettingsItems = [
    { key: 'support', icon: HelpCircle, label: t('sidebar.support') },
    { key: 'settings', icon: Settings, label: t('sidebar.settings'), path: '/settings' },
  ]

  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-14 items-center gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
            D
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('sidebar.appName')}</p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">ERP Dashboard</p>
          </div>
        </div>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label={t('sidebar.hide')}
            title={t('sidebar.hide')}
          >
            <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 sidebar-scroll">
        {menuGroups.map((group, idx) => (
          <div key={group.title} className={idx === 0 ? '' : 'mt-3'}>
            <p className="mb-1 mt-1 px-2 text-[11px] font-semibold tracking-wider text-zinc-500">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const hasChildren = item.children?.length > 0
                const isExpanded = hasChildren && expandedPaths.has(item.path)
                const isActive = isSidebarItemActive(item, location.pathname)
                const childActive = hasChildren
                  && item.children.some((child) => isSidebarItemActive(child, location.pathname))

                return (
                  <div key={item.path}>
                    <div className="relative">
                      {(isActive || childActive) && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute inset-0 rounded-lg bg-zinc-100 dark:bg-zinc-800"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                      <div className="relative flex items-center">
                        <Link
                          to={item.path}
                          onClick={onNavigate}
                          className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                            isActive || childActive
                              ? 'font-medium text-zinc-900 dark:text-zinc-100'
                              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {item.labelKey ? t(item.labelKey, { defaultValue: item.label }) : item.label}
                          </span>
                        </Link>
                        {hasChildren && (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(item.path)}
                            className="relative mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-200/80 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                            aria-label={isExpanded ? 'Collapse sub-menu' : 'Expand sub-menu'}
                          >
                            <ChevronDown
                              className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                            />
                          </button>
                        )}
                      </div>
                    </div>

                    {hasChildren && isExpanded && (
                      <div className="mt-0.5 space-y-0.5 pl-3">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon
                          const isChildActive = isSidebarItemActive(child, location.pathname)
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              onClick={onNavigate}
                              className={`flex items-center gap-2.5 rounded-lg py-1.5 pl-6 pr-3 text-[13px] transition ${
                                isChildActive
                                  ? 'bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-200'
                              }`}
                            >
                              <ChildIcon className="h-3 w-3 shrink-0 opacity-80" />
                              <span className="truncate">{child.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-zinc-200 p-2 dark:border-zinc-800">
        {supportAndSettingsItems.map((item) => {
          const Icon = item.icon
          if (item.path) {
            return (
              <Link
                key={item.key}
                to={item.path}
                onClick={onNavigate}
                className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          }

          return (
            <button
              key={item.key}
              type="button"
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          )
        })}

        <Menu as="div" className="relative">
          <Menu.Button className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-left transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800">
            <div className="relative">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-200 dark:text-zinc-900">
                {avatarInitials(user?.full_name)}
              </div>
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-zinc-50 bg-emerald-500 dark:border-zinc-900" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {user?.full_name || 'User'}
              </p>
              <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">{user?.email || '-'}</p>
            </div>
            <ChevronUp className="h-4 w-4 text-zinc-500" />
          </Menu.Button>

          <Menu.Items className="absolute bottom-16 left-0 z-40 w-64 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg outline-none focus:outline-none dark:border-zinc-800 dark:bg-[#1c1c1e]">
            <div className="p-2">
              <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-200 dark:text-zinc-900">
                    {avatarInitials(user?.full_name)}
                  </div>
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-[#1c1c1e]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {user?.full_name || 'User'}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user?.email || '-'}</p>
                </div>
                <div className="relative h-4 w-4 rounded-full border border-zinc-300 dark:border-zinc-600">
                  <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                </div>
              </div>

              <div className="my-1 h-px bg-gray-200 dark:bg-zinc-800" />

              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      toggleTheme()
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left ${
                      active ? 'bg-gray-50 dark:bg-zinc-800' : ''
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{t('profile.theme')}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {theme === 'dark' ? t('profile.dark') : t('profile.light')}
                      </p>
                    </div>
                    {theme === 'dark' ? (
                      <Sun className="h-4 w-4 text-zinc-500" />
                    ) : (
                      <Moon className="h-4 w-4 text-zinc-500" />
                    )}
                  </button>
                )}
              </Menu.Item>

              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={() => changeLanguage(i18n.language === 'en' ? 'fr' : 'en')}
                    className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left ${
                      active ? 'bg-gray-50 dark:bg-zinc-800' : ''
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{t('profile.language')}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">{i18n.language}</p>
                    </div>
                    <Globe className="h-4 w-4 text-zinc-500" />
                  </button>
                )}
              </Menu.Item>

              <div className="my-1 h-px bg-gray-200 dark:bg-zinc-800" />

              <Menu.Item>
                {({ active }) => (
                  <Link
                    to="/profile"
                    className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left ${
                      active ? 'bg-gray-50 dark:bg-zinc-800' : ''
                    }`}
                  >
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{t('profile.accountSettings')}</span>
                    <Settings className="h-4 w-4 text-zinc-500" />
                  </Link>
                )}
              </Menu.Item>

              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left ${
                      active ? 'bg-gray-50 dark:bg-zinc-800' : ''
                    }`}
                  >
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{t('profile.deviceManagement')}</span>
                    <CheckCircle2 className="h-4 w-4 text-zinc-500" />
                  </button>
                )}
              </Menu.Item>

              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={logout}
                    className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left ${
                      active ? 'bg-red-50 dark:bg-red-950/40' : ''
                    }`}
                  >
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">{t('profile.signOut')}</span>
                    <LogOut className="h-4 w-4 text-red-500" />
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Menu>
      </div>
    </aside>
  )
}
