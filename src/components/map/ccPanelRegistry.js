import React from 'react'
import {
  AlertTriangle,
  Boxes,
  Building2,
  ClipboardList,
  Factory,
  Map as MapIcon,
  Package,
  PackageCheck,
  Settings,
  ShieldCheck,
  Tags,
  Shapes,
  Route,
  Truck,
  Users,
  Store,
  User2,
  Banknote,
  PackageOpen,
  Warehouse,
  RotateCcw,
  CreditCard,
} from 'lucide-react'
import { PERMISSIONS, PERMISSION_GROUPS } from '../../config/permissions'
import { UsersPage } from '../../pages/UsersPage'
import { UserProfilePage } from '../../pages/UserProfilePage'
import { RolesPage } from '../../pages/RolesPage'
import { SettingsPage } from '../../pages/SettingsPage'
import { ProfilePage } from '../../pages/ProfilePage'
import { ClientStoreCategoriesPage } from '../../pages/clients/ClientStoreCategoriesPage'
import { BrandsPage } from '../../pages/catalog/BrandsPage'
import { CategoriesPage } from '../../pages/catalog/CategoriesPage'
import { ProductsPage } from '../../pages/catalog/ProductsPage'
import { OrdersPage } from '../../pages/operations/OrdersPage'
import { OrderDetailsPage } from '../../pages/operations/OrderDetailsPage'
import { MissionsPage } from '../../pages/operations/MissionsPage'
import { MissionDetailsPage } from '../../pages/operations/MissionDetailsPage'
import { CustomStopTemplatesPage } from '../../pages/operations/CustomStopTemplatesPage'
import { ExceptionsPage } from '../../pages/operations/ExceptionsPage'
import { ReturnsApprovalListPage } from '../../pages/operations/ReturnsApprovalListPage'
import { ReturnApprovalDetailPage } from '../../pages/operations/ReturnApprovalDetailPage'
import { CheckReviewsListPage } from '../../pages/operations/CheckReviewsListPage'
import { CheckReviewDetailPage } from '../../pages/operations/CheckReviewDetailPage'
import { DebtPage } from '../../pages/finance/DebtPage'
import { StockPage } from '../../pages/inventory/StockPage'
import { StockProductDetailPage } from '../../pages/inventory/StockProductDetailPage'
import { StockRequestDetailPage } from '../../pages/inventory/StockRequestDetailPage'
import { ProposalsPage } from '../../pages/inventory/ProposalsPage'
import { FulfillmentPage } from '../../pages/inventory/FulfillmentPage'
import { ShipmentsPage } from '../../pages/operations/ShipmentsPage'

/** @deprecated Legacy query keys — kept for old-link redirects only */
export const CC_PANEL_PARAM = 'panel'
export const CC_PANEL_ID_PARAM = 'id'
export const CC_PANEL_FOCUS_PARAM = 'focus'
export const CC_RAIL_EXPANDED_KEY = 'distrac.cc.rail.expanded'

/** Map-admin panel key → logistics entity type (for /clients/:id style detail) */
export const MAP_ENTITY_TYPE_BY_PANEL = {
  industries: 'industry',
  depots: 'depot',
  regions: 'region',
  sectors: 'sector',
  clients: 'client',
  vehicles: 'vehicle',
}

export const MAP_PANEL_BY_ENTITY_TYPE = Object.fromEntries(
  Object.entries(MAP_ENTITY_TYPE_BY_PANEL).map(([panel, type]) => [type, panel]),
)

/** Ordered left-rail tabs for DEPOT_SUPERVISOR */
export const DEPOT_MANAGER_RAIL_KEYS = [
  'missions',
  'exceptions',
  'shipments',
  'stock',
  'fulfillment',
  'revenue',
  'clients',
  'team',
  'vehicles',
  'regions',
  'sectors',
]

/** Visual group breaks in the depot manager rail */
export const DEPOT_MANAGER_RAIL_GROUPS = [
  ['missions', 'exceptions', 'shipments', 'stock', 'fulfillment'],
  ['revenue', 'clients', 'team', 'vehicles'],
  ['regions', 'sectors'],
]

/** Map-admin right-rail lists — GM sidebar + shared Clients/Vehicles UI */
export const MAP_ADMIN_PANEL_KEYS = [
  'industries',
  'depots',
  'regions',
  'sectors',
  'clients',
  'vehicles',
]

export function isMapAdminPanel(key) {
  return MAP_ADMIN_PANEL_KEYS.includes(key)
}

/** @deprecated Alias map for old callers; paths are now first-class */
export const MAP_LAYER_LIST_REDIRECTS = {
  '/industries': 'industries',
  '/depots': 'depots',
  '/regions': 'regions',
  '/sectors': 'sectors',
  '/clients': 'clients',
  '/vehicles': 'vehicles',
}

/** Legacy panel query aliases → canonical key */
export const LEGACY_PANEL_ALIASES = {
  'map-clients': 'clients',
  'map-vehicles': 'vehicles',
}

function MapAdminPanelStub() {
  return null
}

/**
 * Migrated ERP panels — permissions copied from App.jsx route guards.
 * Map-admin rails are first-class panels (mapAdminRail) for GM navigation.
 */
export const CC_PANEL_REGISTRY = [
  {
    key: 'sectors',
    label: 'Sectors',
    labelKey: 'commandCenter.layers.sectors',
    icon: Building2,
    requiredPermission: PERMISSION_GROUPS.sectors,
    listPath: '/sectors',
    detailPath: (id) => `/sectors/${id}`,
    List: MapAdminPanelStub,
    group: 'MAP',
    mapAdminRail: true,
  },
  {
    key: 'industries',
    label: 'Industries',
    labelKey: 'commandCenter.layers.industries',
    icon: Factory,
    requiredPermission: PERMISSION_GROUPS.industries,
    listPath: '/industries',
    detailPath: (id) => `/industries/${id}`,
    List: MapAdminPanelStub,
    group: 'MAP',
    mapAdminRail: true,
  },
  {
    key: 'depots',
    label: 'Depots',
    labelKey: 'commandCenter.layers.depots',
    icon: Warehouse,
    requiredPermission: PERMISSION_GROUPS.depots,
    listPath: '/depots',
    detailPath: (id) => `/depots/${id}`,
    List: MapAdminPanelStub,
    group: 'MAP',
    mapAdminRail: true,
  },
  {
    key: 'regions',
    label: 'Regions',
    labelKey: 'commandCenter.layers.regions',
    icon: MapIcon,
    requiredPermission: PERMISSION_GROUPS.regions,
    listPath: '/regions',
    detailPath: (id) => `/regions/${id}`,
    List: MapAdminPanelStub,
    group: 'MAP',
    mapAdminRail: true,
  },
  {
    key: 'users',
    label: 'Users',
    labelKey: 'sidebar.users',
    icon: Users,
    requiredPermission: [PERMISSIONS.VIEW_USERS_TAB, PERMISSIONS.MANAGE_USERS],
    listPath: '/users',
    detailPath: (id) => `/users/${id}`,
    List: UsersPage,
    Detail: UserProfilePage,
    group: 'SYSTEM',
  },
  {
    key: 'roles',
    label: 'Roles',
    labelKey: 'sidebar.roles',
    icon: ShieldCheck,
    requiredPermission: PERMISSIONS.MANAGE_ROLES,
    listPath: '/roles',
    List: RolesPage,
    group: 'SYSTEM',
  },
  {
    key: 'settings',
    label: 'Settings',
    labelKey: 'sidebar.settings',
    icon: Settings,
    requiredPermission: PERMISSIONS.MANAGE_SETTINGS,
    listPath: '/settings',
    List: SettingsPage,
    group: 'SYSTEM',
    /** Opened from profile menu, not the left command rail */
    showInRail: false,
  },
  {
    key: 'profile',
    label: 'Profile',
    labelKey: 'profile.accountSettings',
    icon: User2,
    requiredPermission: null,
    listPath: '/profile',
    List: ProfilePage,
    group: 'SYSTEM',
    /** Opened from command-bar avatar / profile menu, not the ERP rail list */
    showInRail: false,
  },
  {
    key: 'store-categories',
    label: 'Store categories',
    icon: Tags,
    requiredPermission: PERMISSIONS.MANAGE_CLIENTS,
    listPath: '/clients/store-categories',
    List: ClientStoreCategoriesPage,
    group: 'SYSTEM',
  },
  {
    key: 'brands',
    label: 'Brands',
    icon: Tags,
    requiredPermission: PERMISSION_GROUPS.catalogBrands,
    listPath: '/brands',
    List: BrandsPage,
    group: 'CATALOG',
  },
  {
    key: 'categories',
    label: 'Categories',
    icon: Shapes,
    requiredPermission: PERMISSION_GROUPS.catalogCategories,
    listPath: '/categories',
    List: CategoriesPage,
    group: 'CATALOG',
  },
  {
    key: 'orders',
    label: 'Orders',
    labelKey: 'sidebar.orders',
    icon: Package,
    requiredPermission: PERMISSIONS.VIEW_ORDERS_TAB,
    listPath: '/orders',
    detailPath: (id) => `/orders/${id}`,
    List: OrdersPage,
    Detail: OrderDetailsPage,
    group: 'OPERATIONS',
  },
  {
    key: 'missions',
    label: 'Missions',
    labelKey: 'sidebar.missions',
    icon: Route,
    requiredPermission: PERMISSION_GROUPS.missions,
    listPath: '/missions',
    detailPath: (id) => `/missions/${id}`,
    List: MissionsPage,
    Detail: MissionDetailsPage,
    group: 'OPERATIONS',
  },
  {
    key: 'custom-stop-templates',
    label: 'Custom stop templates',
    labelKey: 'sidebar.customStopTemplates',
    icon: ClipboardList,
    requiredPermission: [PERMISSIONS.MANAGE_MISSIONS, PERMISSIONS.MANAGE_LOGISTICS],
    listPath: '/missions/custom-stop-templates',
    List: CustomStopTemplatesPage,
    group: 'OPERATIONS',
  },
  {
    key: 'exceptions',
    label: 'Approvals',
    labelKey: 'sidebar.exceptions',
    icon: AlertTriangle,
    requiredPermission: PERMISSIONS.MANAGE_EXCEPTIONS,
    listPath: '/exceptions',
    List: ExceptionsPage,
    group: 'OPERATIONS',
  },
  {
    key: 'returns',
    label: 'Returns',
    icon: RotateCcw,
    requiredPermission: PERMISSIONS.MANAGE_EXCEPTIONS,
    listPath: '/returns',
    detailPath: (id) => `/returns/${id}`,
    List: ReturnsApprovalListPage,
    Detail: ReturnApprovalDetailPage,
    group: 'OPERATIONS',
    showInRail: false,
  },
  {
    key: 'check-reviews',
    label: 'Check reviews',
    icon: CreditCard,
    requiredPermission: PERMISSIONS.MANAGE_EXCEPTIONS,
    listPath: '/check-reviews',
    detailPath: (id) => `/check-reviews/${id}`,
    List: CheckReviewsListPage,
    Detail: CheckReviewDetailPage,
    group: 'OPERATIONS',
    showInRail: false,
  },
  {
    key: 'shipments',
    label: 'Shipments',
    icon: PackageOpen,
    requiredPermission: null,
    listPath: '/shipments',
    List: ShipmentsPage,
    group: 'OPERATIONS',
    showInRail: false,
  },
  {
    key: 'revenue',
    label: 'Revenue',
    icon: Banknote,
    requiredPermission: PERMISSION_GROUPS.debt,
    listPath: '/revenue',
    List: DebtPage,
    group: 'FINANCE',
  },
  {
    key: 'stock',
    label: 'Stock',
    icon: Boxes,
    requiredPermission: PERMISSION_GROUPS.stock,
    listPath: '/inventory/stock',
    detailPath: (id, focus) =>
      focus === 'request'
        ? `/inventory/stock/requests/${id}`
        : `/inventory/stock/${id}`,
    List: StockPage,
    Detail: StockProductDetailPage,
    RequestDetail: StockRequestDetailPage,
    group: 'INVENTORY',
  },
  {
    key: 'products',
    label: 'Products',
    icon: Package,
    requiredPermission: PERMISSION_GROUPS.catalogProducts,
    listPath: '/products',
    List: ProductsPage,
    group: 'INVENTORY',
  },
  {
    key: 'proposals',
    label: 'Proposal Inbox',
    icon: ClipboardList,
    requiredPermission: PERMISSIONS.VIEW_PROPOSALS,
    listPath: '/inventory/proposals',
    List: ProposalsPage,
    group: 'INVENTORY',
    /** Nested under Stock tabs for depot; not a separate rail icon */
    showInRail: false,
  },
  {
    key: 'fulfillment',
    label: 'Industry restock',
    icon: PackageCheck,
    requiredPermission: PERMISSIONS.VIEW_FULFILLMENT,
    listPath: '/inventory/fulfillment',
    List: FulfillmentPage,
    group: 'INVENTORY',
  },
  {
    key: 'clients',
    label: 'Clients',
    labelKey: 'commandCenter.layers.clients',
    icon: Store,
    requiredPermission: PERMISSION_GROUPS.clients,
    listPath: '/clients',
    detailPath: (id) => `/clients/${id}`,
    List: MapAdminPanelStub,
    group: 'MAP',
    mapAdminRail: true,
  },
  {
    key: 'team',
    label: 'Team',
    icon: Users,
    requiredPermission: [PERMISSIONS.VIEW_USERS_TAB, PERMISSIONS.MANAGE_USERS],
    listPath: '/team',
    detailPath: (id) => `/users/${id}`,
    List: UsersPage,
    Detail: UserProfilePage,
    group: 'SYSTEM',
    showInRail: false,
  },
  {
    key: 'vehicles',
    label: 'Vehicles',
    labelKey: 'commandCenter.layers.vehicles',
    icon: Truck,
    requiredPermission: [PERMISSIONS.VIEW_LOGISTICS_TAB, PERMISSIONS.MANAGE_LOGISTICS],
    listPath: '/vehicles',
    detailPath: (id) => `/vehicles/${id}`,
    List: MapAdminPanelStub,
    group: 'MAP',
    mapAdminRail: true,
  },
]

const BY_KEY = Object.fromEntries(CC_PANEL_REGISTRY.map((p) => [p.key, p]))

export function getCcPanel(key) {
  return BY_KEY[key] || null
}

export function getAuthRoleName(user) {
  const raw =
    user?.role?.name ||
    user?.role_name ||
    user?.roleName ||
    user?.roles?.name ||
    user?.role ||
    ''
  return String(raw).toUpperCase()
}

export function isDepotSupervisorRole(userOrRoleName) {
  const name =
    typeof userOrRoleName === 'string'
      ? String(userOrRoleName).toUpperCase()
      : getAuthRoleName(userOrRoleName)
  return name === 'DEPOT_SUPERVISOR'
}

/** Same OR-array rule as ProtectedRoute */
export function hasCcPanelPermission(hasPermission, requiredPermission) {
  if (!requiredPermission) return true
  if (Array.isArray(requiredPermission)) {
    return requiredPermission.some((perm) => hasPermission(perm))
  }
  return hasPermission(requiredPermission)
}

/**
 * @param {Function} hasPermission
 * @param {{ roleName?: string, user?: object }} [options]
 */
export function filterCcPanelsForUser(hasPermission, options = {}) {
  const roleName = options.roleName || getAuthRoleName(options.user)

  if (isDepotSupervisorRole(roleName)) {
    return DEPOT_MANAGER_RAIL_KEYS.map((key) => BY_KEY[key]).filter(
      (p) => p && hasCcPanelPermission(hasPermission, p.requiredPermission),
    )
  }

  return CC_PANEL_REGISTRY.filter(
    (p) =>
      p.showInRail !== false &&
      hasCcPanelPermission(hasPermission, p.requiredPermission),
  )
}

/** Depot rail panels grouped for visual separators in the command bar */
export function buildDepotManagerRailGroups(hasPermission, options = {}) {
  const panels = filterCcPanelsForUser(hasPermission, options)
  const byKey = Object.fromEntries(panels.map((p) => [p.key, p]))
  return DEPOT_MANAGER_RAIL_GROUPS.map((group) =>
    group.map((key) => byKey[key]).filter(Boolean),
  ).filter((group) => group.length > 0)
}

/** GM rail: map-admin group first, then remaining ERP modules */
export function buildGmRailGroups(hasPermission, options = {}) {
  const panels = filterCcPanelsForUser(hasPermission, options)
  const mapAdmin = panels.filter((p) => p.mapAdminRail)
  const rest = panels.filter((p) => !p.mapAdminRail)
  return [mapAdmin, rest].filter((group) => group.length > 0)
}

export function readPanelFromSearchParams(searchParams) {
  let panel = searchParams.get(CC_PANEL_PARAM)
  if (panel && LEGACY_PANEL_ALIASES[panel]) {
    panel = LEGACY_PANEL_ALIASES[panel]
  }
  if (!panel || !BY_KEY[panel]) {
    return { panel: null, id: null, focus: null, entry: null }
  }
  return {
    panel,
    id: searchParams.get(CC_PANEL_ID_PARAM),
    focus: searchParams.get(CC_PANEL_FOCUS_PARAM),
    entry: BY_KEY[panel],
  }
}

/**
 * Parse Command Center module from a real pathname (source of truth).
 * Longer listPaths win (e.g. /missions/custom-stop-templates before /missions).
 */
export function readPanelFromPathname(pathname, searchParams = new URLSearchParams()) {
  let path = (pathname || '/').replace(/\/+$/, '') || '/'
  const PATH_ALIASES = {
    '/debt': '/revenue',
    '/clients/list': '/clients',
    '/vehicles/list': '/vehicles',
  }
  path = PATH_ALIASES[path] || path
  if (path === '/') {
    return { panel: null, id: null, focus: null, entry: null, entityType: null }
  }

  const entries = [...CC_PANEL_REGISTRY].sort(
    (a, b) => (b.listPath?.length || 0) - (a.listPath?.length || 0),
  )

  for (const entry of entries) {
    const list = entry.listPath
    if (!list) continue

    if (path === list) {
      return {
        panel: entry.key,
        id: null,
        focus: searchParams.get(CC_PANEL_FOCUS_PARAM),
        entry,
        entityType: MAP_ENTITY_TYPE_BY_PANEL[entry.key] || null,
      }
    }

    if (entry.key === 'stock' && path.startsWith('/inventory/stock/requests/')) {
      const id = path.slice('/inventory/stock/requests/'.length).split('/')[0]
      if (id) {
        return {
          panel: 'stock',
          id,
          focus: 'request',
          entry,
          entityType: null,
        }
      }
    }

    if (entry.key === 'stock' && path.startsWith('/inventory/stock/') && path !== list) {
      const id = path.slice('/inventory/stock/'.length).split('/')[0]
      if (id && id !== 'requests') {
        return {
          panel: 'stock',
          id,
          focus: null,
          entry,
          entityType: null,
        }
      }
    }

    if (entry.key === 'team' && path.startsWith('/users/')) {
      const id = path.slice('/users/'.length).split('/')[0]
      if (id) {
        return {
          panel: 'team',
          id,
          focus: null,
          entry: BY_KEY.users || entry,
          entityType: null,
        }
      }
    }

    if (path.startsWith(`${list}/`)) {
      const rest = path.slice(list.length + 1)
      const id = rest.split('/')[0]
      if (!id) continue
      // Avoid treating nested list paths as parent detail (handled by sort + exact match)
      const isNestedList = CC_PANEL_REGISTRY.some(
        (other) => other.key !== entry.key && other.listPath === `${list}/${id}`,
      )
      if (isNestedList) continue
      return {
        panel: entry.key,
        id,
        focus: searchParams.get(CC_PANEL_FOCUS_PARAM),
        entry,
        entityType: MAP_ENTITY_TYPE_BY_PANEL[entry.key] || null,
      }
    }
  }

  return { panel: null, id: null, focus: null, entry: null, entityType: null }
}

/**
 * @deprecated Query merge for create= only; panel state lives in the pathname.
 */
export function applyPanelToSearchParams(searchParams, { panel = null, id = null, focus = null } = {}) {
  const next = new URLSearchParams(searchParams)
  ;[CC_PANEL_PARAM, CC_PANEL_ID_PARAM, CC_PANEL_FOCUS_PARAM, 'type'].forEach((k) => next.delete(k))
  if (panel) {
    next.set(CC_PANEL_PARAM, panel)
    if (id) next.set(CC_PANEL_ID_PARAM, String(id))
    if (focus) next.set(CC_PANEL_FOCUS_PARAM, String(focus))
  }
  return next
}

/** Real path used as synthetic location for CcPanelHost <Routes location> */
export function resolvePanelSyntheticPath(entry, id, focus) {
  if (!entry) return '/'
  if (id && entry.key === 'stock') {
    return focus === 'request'
      ? `/inventory/stock/requests/${id}`
      : `/inventory/stock/${id}`
  }
  if (id && entry.detailPath) {
    return typeof entry.detailPath === 'function'
      ? entry.detailPath(id, focus)
      : entry.detailPath
  }
  return entry.listPath
}

export function panelDetailRoutePattern(entry, focus) {
  if (entry.key === 'stock' && focus === 'request') {
    return `/inventory/stock/requests/:requestId`
  }
  if (entry.key === 'stock') {
    return `/inventory/stock/:productId`
  }
  if (entry.key === 'users' || entry.key === 'team') {
    return `/users/:id`
  }
  if (entry.key === 'orders') return `/orders/:id`
  if (entry.key === 'missions') return `/missions/:id`
  if (entry.key === 'returns') return `/returns/:id`
  if (entry.key === 'check-reviews') return `/check-reviews/:id`
  if (entry.detailPath) {
    // e.g. /clients/:id — pattern for unused map-admin ERP host
    return `${entry.listPath}/:id`
  }
  return `${entry.listPath}/*`
}

/** Build list/detail href. Home (no panel) → `/`. */
export function buildGlobalMapPanelHref(panel, id = null, focus = null) {
  if (!panel) return '/'
  const key = LEGACY_PANEL_ALIASES[panel] || panel
  const entry = BY_KEY[key]
  if (!entry) return '/'
  if (id && entry.key === 'stock') {
    return focus === 'request'
      ? `/inventory/stock/requests/${id}`
      : `/inventory/stock/${id}`
  }
  if (id && entry.key === 'team') {
    return `/users/${id}`
  }
  if (id && entry.detailPath) {
    return typeof entry.detailPath === 'function' ? entry.detailPath(id, focus) : `${entry.listPath}/${id}`
  }
  if (id) {
    return `${entry.listPath}/${id}`
  }
  return entry.listPath
}

/** Map entity detail → `/clients/:id` (optional ?tab=&focus=) */
export const MAP_ENTITY_DETAIL_TYPES = {
  industry: 'industry',
  depot: 'depot',
  sector: 'sector',
  client: 'client',
  region: 'region',
  vehicle: 'vehicle',
}

export function buildGlobalMapEntityHref(type, id, extras = {}) {
  const panel = MAP_PANEL_BY_ENTITY_TYPE[type]
  if (!panel || id == null) return '/'
  const params = new URLSearchParams()
  if (extras.tab) params.set('tab', String(extras.tab))
  if (extras.focus) params.set('focus', String(extras.focus))
  const base = buildGlobalMapPanelHref(panel, id)
  const q = params.toString()
  return q ? `${base}?${q}` : base
}

/** Convert legacy /global-map?panel=&id= / ?type=&id= into a modern path */
export function legacyGlobalMapSearchToPath(searchParams) {
  const type = searchParams.get('type')
  const typeId = searchParams.get('id')
  if (type && typeId && MAP_PANEL_BY_ENTITY_TYPE[type]) {
    return buildGlobalMapEntityHref(type, typeId, {
      tab: searchParams.get('tab') || undefined,
      focus: searchParams.get('focus') || undefined,
    })
  }

  let panel = searchParams.get(CC_PANEL_PARAM)
  if (panel && LEGACY_PANEL_ALIASES[panel]) panel = LEGACY_PANEL_ALIASES[panel]
  if (panel && BY_KEY[panel]) {
    return buildGlobalMapPanelHref(
      panel,
      searchParams.get(CC_PANEL_ID_PARAM),
      searchParams.get(CC_PANEL_FOCUS_PARAM),
    )
  }

  const create = searchParams.get('create')
  if (create === 'region' || create === 'industry') {
    return `/?create=${create}`
  }

  return '/'
}
