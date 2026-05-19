# Quick Start Guide

## ⚡ 30-Second Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   - Navigate to `http://localhost:5173`
   - You should see the Login page

4. **Login with admin account:**
   - Email: `admin@distrac.com`
   - Password: `Admin123456!`

5. **Expected result:**
   - Redirected to dashboard
   - Sidebar shows menu based on your permissions
   - User profile and permissions displayed on dashboard home

## ✅ Pre-Flight Checklist

Before starting:
- [ ] Backend (Node.js) is running on `http://localhost:3000`
- [ ] Backend endpoints are working:
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/profile`
  - `GET /api/v1/auth/permissions`
- [ ] Admin account exists with email `admin@distrac.com`
- [ ] Node.js & npm are installed locally
- [ ] You ran `npm install` in this directory

## 🔍 Testing Permission-Based Rendering

1. Login to the dashboard
2. Go to the Home page - you should see a list of your permissions
3. Check the sidebar:
   - **Users** menu appears only if you have `manage_users` permission
   - **Roles** menu appears only if you have `manage_roles` permission
   - **Missions** menu appears only if you have `view_missions` permission
4. Try navigating to `/users` directly in URL if you lack permission - you should get 403 Unauthorized page

## 📝 Credentials

**Admin Account:**
- Email: `admin@distrac.com`
- Password: `Admin123456!`

(Use the account from your backend scenario seeder)

## 🚀 Next Steps

Once the dashboard loads successfully:
1. Build out individual page modules (Users, Orders, Missions, etc.)
2. Add forms and data tables for CRUD operations
3. Connect API calls to backend modules
4. Add real-time updates if needed
5. Implement advanced filtering and search

## 📚 Useful Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint code
npm run lint
```

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 5173 already in use | Vite will auto-increment to 5174, 5175, etc. |
| 404 "Cannot POST /api/v1/auth/login" | Verify backend is running on port 3000 |
| Login works but sidebar is empty | Check backend returns permissions array |
| Styles look broken | Clear browser cache and reload |
| Token disappears on refresh | Ensure localStorage is enabled in browser |

## 📞 Support

For issues with the backend API integration, check:
- Backend console for errors
- Browser DevTools > Network tab (to see actual API responses)
- Browser DevTools > Application > Local Storage (to see saved token)
