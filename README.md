# DISTRAC Admin Web Dashboard

Modern React-based control panel for DISTRAC ERP system management with dynamic permission-based RBAC.

## Features

✨ **Dynamic Permission-Based RBAC** - Sidebar and routes automatically adapt based on user permissions from backend.

🔐 **Secure Authentication** - Token-based auth with automatic 401 redirect and localStorage persistence.

🎨 **Modern UI** - Built with React, Tailwind CSS, and Lucide React icons for a professional interface.

🚀 **Vite-Powered** - Fast development server and optimized production builds.

🔄 **Axios Integration** - Pre-configured API client with interceptors for automatic token attachment and error handling.

## Project Structure

```
src/
├── api/
│   └── axiosInstance.js          # Axios instance with interceptors
├── components/
│   ├── DashboardLayout.jsx        # Main layout with sidebar & header
│   └── ProtectedRoute.jsx         # Permission-gated route wrapper
├── config/
│   └── menuConfig.js              # Dynamic menu configuration
├── context/
│   └── AuthContext.jsx            # Global auth state management
├── pages/
│   ├── Login.jsx                  # Login page
│   ├── DashboardHome.jsx          # Dashboard home page
│   ├── Unauthorized.jsx           # 403 error page
│   ├── UsersPage.jsx              # Users management (stub)
│   ├── RolesPage.jsx              # Roles management (stub)
│   └── MissionsPage.jsx           # Missions module (stub)
├── App.jsx                        # Main app with routing
├── main.jsx                       # Entry point
└── index.css                      # Tailwind styles
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update if needed:

```bash
cp .env.example .env
```

Default values:
- `VITE_API_BASE_URL=http://localhost:3000/api/v1`
- `VITE_API_TIMEOUT=10000`

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

### Login Flow

1. Navigate to `http://localhost:5173/login`
2. Enter credentials (e.g., `admin@distrac.com` / `Admin123456!`)
3. The app will:
   - POST to `/auth/login` and save the token
   - Fetch `/auth/profile` for user data
   - Fetch `/auth/permissions` for permission array
   - Redirect to dashboard

### Sidebar Menu

The sidebar dynamically renders based on permissions:
- Each menu item has a `requiredPermission` string
- Items are filtered out if user lacks the permission
- Items are highlighted based on current route

### Protected Routes

Use the `<ProtectedRoute>` component to gate pages:

```jsx
<Route
  path="/users"
  element={
    <ProtectedRoute requiredPermission="manage_users">
      <UsersPage />
    </ProtectedRoute>
  }
/>
```

If user lacks the permission, they are redirected to `/unauthorized`.

### Using the Auth Context

```jsx
import { useAuth } from './context/AuthContext'

function MyComponent() {
  const { user, permissions, hasPermission, logout } = useAuth()

  if (hasPermission('some_permission')) {
    // render something
  }

  return <div>{user?.full_name}</div>
}
```

## API Integration

The app is pre-configured to work with the DISTRAC backend Node.js API:

### Expected Backend Endpoints

- `POST /api/v1/auth/login` - Login with email/password
  ```json
  {
    "email": "admin@distrac.com",
    "password": "Admin123456!"
  }
  ```
  Response: `{ data: { accessToken: "jwt_token", user: {...} } }`

- `GET /api/v1/auth/profile` - Get logged-in user profile
  Response: `{ data: { user: { id, email, full_name, roles: { name } } } }`

- `GET /api/v1/auth/permissions` - Get user permissions array
  Response: `{ data: { permissions: ["view_orders_tab", "manage_users", ...] } }`

### Axios Interceptors

- **Request**: Automatically attaches `Authorization: Bearer <token>` from localStorage
- **Response**: Catches 401 errors, clears auth state, and redirects to `/login`

## Building for Production

```bash
npm run build
```

Output is in `dist/` folder. Serve with your web server (nginx, Apache, etc.).

## Key Features in Detail

### 1. Dynamic Sidebar

Located in `DashboardLayout.jsx`:
- Maps over `menuConfig.js` menu items
- Filters based on `hasPermission()` check
- Highlights active route
- Collapsible for better UX
- Shows user profile in footer

### 2. Authentication Flow

Located in `AuthContext.jsx`:
- `login(email, password)` - handles login and context fetch
- `fetchUserContext()` - gets profile + permissions from backend
- `logout()` - clears auth state and localStorage
- `initializeFromStorage()` - restores auth on page reload
- `hasPermission(permission)` - checks if user has a permission string

### 3. Permission Gating

Two levels:
- **Page-level**: `<ProtectedRoute requiredPermission="...">` redirects unauthorized users
- **UI-level**: Sidebar automatically hides menu items user can't access

## Customization

### Adding a New Page

1. Create file in `src/pages/MyPage.jsx`:
   ```jsx
   import { DashboardLayout } from '../components/DashboardLayout'
   
   export function MyPage() {
     return (
       <DashboardLayout>
         {/* Your content */}
       </DashboardLayout>
     )
   }
   ```

2. Add route in `App.jsx`:
   ```jsx
   <Route
     path="/mypage"
     element={
       <ProtectedRoute requiredPermission="view_mypage">
         <MyPage />
       </ProtectedRoute>
     }
   />
   ```

3. Add to sidebar in `menuConfig.js`:
   ```js
   {
     label: 'My Page',
     path: '/mypage',
     icon: MyIcon,
     requiredPermission: 'view_mypage',
   }
   ```

### Styling

Tailwind CSS is pre-configured with custom DISTRAC colors:
- `text-distrac-primary` (blue)
- `text-distrac-secondary` (darker blue)
- `text-distrac-accent` (cyan)
- `text-distrac-dark` (gray-900)
- `bg-distrac-light` (gray-50)

## Troubleshooting

**401 errors on page load?**
- Check that your backend is running at the URL in `.env`
- Verify token is being saved correctly in `Application > Local Storage`

**Sidebar menu items not showing?**
- Check that permissions from backend match the `requiredPermission` strings in `menuConfig.js`
- Use browser DevTools to inspect Network tab and see what permissions are returned

**Styles not loading?**
- Ensure Tailwind CSS is properly configured in `tailwind.config.js`
- Restart dev server if you modified config

## License

© 2026 DISTRAC ERP System
