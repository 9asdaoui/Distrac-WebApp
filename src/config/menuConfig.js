import {
  Home,
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
} from 'lucide-react'

export function getMenuConfig() {
  return [
    {
      type: 'group',
      title: 'SYSTEM',
      items: [
        {
          label: 'Home',
          labelKey: 'sidebar.home',
          path: '/dashboard',
          icon: Home,
          requiredPermission: null,
        },
        {
          label: 'Users',
          labelKey: 'sidebar.users',
          path: '/users',
          icon: Users,
          requiredPermission: 'manage_users',
        },
        {
          label: 'Roles',
          labelKey: 'sidebar.roles',
          path: '/roles',
          icon: ShieldCheck,
          requiredPermission: 'manage_roles',
        },
      ],
    },
    {
      type: 'group',
      title: 'LOGISTICS',
      items: [
        {
          label: 'Industries',
          path: '/industries',
          icon: Factory,
          requiredPermission: ['view_industries', 'view_logistics_tab', 'manage_logistics'],
        },
        {
          label: 'Depots',
          path: '/depots',
          icon: Warehouse,
          requiredPermission: ['view_depots', 'view_logistics_tab', 'manage_logistics'],
        },
        {
          label: 'Regions',
          path: '/regions',
          icon: Map,
          requiredPermission: ['view_regions', 'view_logistics_tab', 'manage_logistics'],
        },
        {
          label: 'Sectors',
          path: '/sectors',
          icon: MapPin,
          requiredPermission: ['view_sectors', 'view_logistics_tab', 'manage_logistics'],
        },
        {
          label: 'Vehicles',
          path: '/vehicles',
          icon: QrCode,
          requiredPermission: 'manage_logistics',
        },
      ],
    },
    {
      type: 'group',
      title: 'CATALOG',
      items: [
        {
          label: 'Products',
          path: '/products',
          icon: Package,
          requiredPermission: ['view_products', 'manage_products'],
        },
        {
          label: 'Brands',
          path: '/brands',
          icon: Tags,
          requiredPermission: ['view_brands', 'manage_products'],
        },
        {
          label: 'Categories',
          path: '/categories',
          icon: Shapes,
          requiredPermission: ['view_categories', 'manage_products'],
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
          requiredPermission: 'view_orders_tab',
        },
        {
          label: 'Missions',
          labelKey: 'sidebar.missions',
          path: '/missions',
          icon: Truck,
          requiredPermission: ['view_missions', 'approve_missions', 'manage_logistics'],
        },
        {
          label: 'Exceptions',
          labelKey: 'sidebar.exceptions',
          path: '/exceptions',
          icon: AlertTriangle,
          requiredPermission: 'manage_exceptions',
        },
      ],
    },
    {
      type: 'group',
      title: 'FINANCE',
      items: [
        {
          label: 'Debt Summary',
          path: '/debt',
          icon: DollarSign,
          requiredPermission: ['view_reports_tab', 'view_finance'],
        },
      ],
    },
    {
      type: 'group',
      title: 'INVENTORY',
      items: [
        {
          label: 'Proposal Inbox',
          path: '/inventory/proposals',
          icon: ClipboardList,
          requiredPermission: null,
        },
        {
          label: 'Fulfillment Tracking',
          path: '/inventory/fulfillment',
          icon: PackageCheck,
          requiredPermission: null,
        },
      ],
    },
  ]
}
