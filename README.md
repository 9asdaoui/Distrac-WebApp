# DISTRAC Admin Web

Office ops dashboard for Distrac: **Command Center** (Leaflet map + operational HUD), RBAC menus, missions, exceptions, inventory, and finance.

## Stack

React 18 · Vite · Tailwind · React Router · Axios · Leaflet (+ markercluster) · Recharts · i18next (FR/EN) · Framer Motion · Lucide

## Setup

```bash
cd distrac_admin_web
npm install
cp .env.example .env
npm run dev
```

Defaults:

- App: `http://localhost:5173`
- `VITE_API_BASE_URL=http://localhost:3000/api/v1`
- Login example: `admin@distrac.com` / `Admin123456!` (from backend bootstrap)

## What you get

Default home is **`/global-map`** (Command Center). `/dashboard` redirects there.

| Group | Routes |
|-------|--------|
| System | Command Center, industries, depots, regions, sectors, clients, **store categories**, vehicles, users, roles, settings |
| Catalog | Brands, categories |
| Operations | Orders, missions, exceptions |
| Finance | Debt |
| Inventory | Stock, products, proposals, fulfillment |
| Personal | Profile (user menu) |

Auth flow: `POST /auth/login` → token in localStorage → `GET /auth/profile` + `GET /auth/permissions`. Sidebar and routes use `PERMISSIONS` / `menuConfig` / `ProtectedRoute`.

Command Center talks to backend map + ops APIs (`/logistics/map/viewport`, SSE `/logistics/map/stream/positions`, `/missions/map-overlay`, exceptions, proposals, missions/today, reports, vendor-load requests, etc.).

## Project layout (high level)

```
src/
├── api/axiosInstance.js
├── components/          # layout, map engine, HUD, shared UI
├── config/              # menuConfig, permissions
├── context/AuthContext.jsx
├── hooks/               # e.g. useOperationsBoard
├── pages/               # logistics, operations, inventory, finance, …
├── App.jsx
└── main.jsx
```

## Docs

- Product / roles on this app: [`../docs/product/web-command-center.md`](../docs/product/web-command-center.md)
- Permissions: [`../docs/product/permissions.md`](../docs/product/permissions.md)
- Map program: [`../docs/map/fluidity/README.md`](../docs/map/fluidity/README.md)
- Monorepo index: [`../docs/README.md`](../docs/README.md)

## Production build

```bash
npm run build
```

Serve `dist/` behind your static host; set `VITE_API_BASE_URL` to the production API.

## Troubleshooting

- **401 on load** — backend up? token in localStorage? CORS / `ALLOWED_ORIGINS` on API?
- **Empty sidebar** — permissions from `/auth/permissions` must match `menuConfig` / `permissions.js` strings
