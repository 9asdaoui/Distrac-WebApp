import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Factory,
  Warehouse,
  Map,
  MapPin,
  Package,
  Tags,
  Shapes,
  Truck,
  AlertTriangle,
  DollarSign,
  ClipboardList,
  PackageCheck,
  QrCode,
  Store,
  Boxes,
  Settings,
} from 'lucide-react'
import { PERMISSIONS, PERMISSION_GROUPS } from './permissions'

export function getMenuConfig() {
  return [
    {
      type: 'group',
      title: 'SYSTEM',
      items: [
        {
          label: 'Command Center',
          labelKey: 'sidebar.commandCenter',
          path: '/',
          icon: LayoutDashboard,
          requiredPermission: PERMISSION_GROUPS.commandCenter,
          children: [
            {
              label: 'Industries',
              path: '/industries',
              icon: Factory,
              requiredPermission: PERMISSION_GROUPS.industries,
            },
            {
              label: 'Depots',
              path: '/depots',
              icon: Warehouse,
              requiredPermission: PERMISSION_GROUPS.depots,
            },
            {
              label: 'Regions',
              path: '/regions',
              icon: Map,
              requiredPermission: PERMISSION_GROUPS.regions,
            },
            {
              label: 'Sectors',
              path: '/sectors',
              icon: MapPin,
              requiredPermission: PERMISSION_GROUPS.sectors,
            },
            {
              label: 'Clients',
              path: '/clients',
              icon: Store,
              requiredPermission: PERMISSION_GROUPS.clients,
            },
            {
              label: 'Store categories',
              path: '/clients/store-categories',
              icon: Tags,
              requiredPermission: PERMISSIONS.MANAGE_CLIENTS,
            },
            {
              label: 'Vehicles',
              path: '/vehicles',
              icon: QrCode,
              requiredPermission: [PERMISSIONS.VIEW_LOGISTICS_TAB, PERMISSIONS.MANAGE_LOGISTICS],
            },
          ],
        },
        {
          label: 'Users',
          labelKey: 'sidebar.users',
          path: '/users',
          icon: Users,
          requiredPermission: [PERMISSIONS.VIEW_USERS_TAB, PERMISSIONS.MANAGE_USERS],
        },
        {
          label: 'Roles',
          labelKey: 'sidebar.roles',
          path: '/roles',
          icon: ShieldCheck,
          requiredPermission: PERMISSIONS.MANAGE_ROLES,
        },
        {
          label: 'Settings',
          labelKey: 'sidebar.settings',
          path: '/settings',
          icon: Settings,
          requiredPermission: PERMISSIONS.MANAGE_SETTINGS,
        },
      ],
    },
    {
      type: 'group',
      title: 'CATALOG',
      items: [
        {
          label: 'Brands',
          path: '/brands',
          icon: Tags,
          requiredPermission: PERMISSION_GROUPS.catalogBrands,
        },
        {
          label: 'Categories',
          path: '/categories',
          icon: Shapes,
          requiredPermission: PERMISSION_GROUPS.catalogCategories,
        },
      ],
    },
    {
      type: 'group',
      title: 'OPERATIONS',
      items: [
        {
          label: 'Orders',
          labelKey: 'sidebar.orders',
          path: '/orders',
          icon: Package,
          requiredPermission: PERMISSIONS.VIEW_ORDERS_TAB,
        },
        {
          label: 'Missions',
          labelKey: 'sidebar.missions',
          path: '/missions',
          icon: Truck,
          requiredPermission: PERMISSION_GROUPS.missions,
        },
        {
          label: 'Custom stop templates',
          labelKey: 'sidebar.customStopTemplates',
          path: '/missions/custom-stop-templates',
          icon: ClipboardList,
          requiredPermission: [PERMISSIONS.MANAGE_MISSIONS, PERMISSIONS.MANAGE_LOGISTICS],
        },
        {
          label: 'Exceptions',
          labelKey: 'sidebar.exceptions',
          path: '/exceptions',
          icon: AlertTriangle,
          requiredPermission: PERMISSIONS.MANAGE_EXCEPTIONS,
        },
      ],
    },
    {
      type: 'group',
      title: 'FINANCE',
      items: [
        {
          label: 'Revenue',
          path: '/revenue',
          icon: DollarSign,
          requiredPermission: PERMISSION_GROUPS.debt,
        },
      ],
    },
    {
      type: 'group',
      title: 'INVENTORY',
      items: [
        {
          label: 'Stock',
          path: '/inventory/stock',
          icon: Boxes,
          requiredPermission: PERMISSION_GROUPS.stock,
        },
        {
          label: 'Products',
          path: '/products',
          icon: Package,
          requiredPermission: PERMISSION_GROUPS.catalogProducts,
        },
        {
          label: 'Proposal Inbox',
          path: '/inventory/proposals',
          icon: ClipboardList,
          requiredPermission: PERMISSIONS.VIEW_PROPOSALS,
        },
        {
          label: 'Industry restock',
          path: '/inventory/fulfillment',
          icon: PackageCheck,
          requiredPermission: PERMISSIONS.VIEW_FULFILLMENT,
        },
      ],
    },
  ]
}
