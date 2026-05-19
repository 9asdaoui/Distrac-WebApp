import React, { createContext, useState, useCallback, useEffect } from 'react'
import apiInstance from '../api/axiosInstance'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const rehydrateAuth = async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken')

      if (!token) {
        if (isMounted) {
          setIsAuthLoading(false)
        }
        return
      }

      localStorage.setItem('token', token)
      localStorage.setItem('authToken', token)

      try {
        const [profileRes, permissionsRes] = await Promise.all([
          apiInstance.get('/auth/profile'),
          apiInstance.get('/auth/permissions'),
        ])

        if (!isMounted) {
          return
        }

        const userProfile = profileRes.data?.data?.user || profileRes.data?.user
        const userPermissions = permissionsRes.data?.data?.permissions || []

        setUser(userProfile)
        setPermissions(userPermissions)
        localStorage.setItem('userProfile', JSON.stringify(userProfile))
        localStorage.setItem('userPermissions', JSON.stringify(userPermissions))
      } catch (err) {
        localStorage.removeItem('token')
        localStorage.removeItem('authToken')
        localStorage.removeItem('userProfile')
        localStorage.removeItem('userPermissions')

        if (isMounted) {
          setUser(null)
          setPermissions([])
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false)
        }
      }
    }

    rehydrateAuth()

    return () => {
      isMounted = false
    }
  }, [])

  const fetchUserContext = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch user profile
      const profileRes = await apiInstance.get('/auth/profile')
      const userProfile = profileRes.data?.data?.user || profileRes.data?.user
      setUser(userProfile)

      // Fetch user permissions
      const permissionsRes = await apiInstance.get('/auth/permissions')
      const userPermissions = permissionsRes.data?.data?.permissions || []
      setPermissions(userPermissions)

      // Store in localStorage for persistence
      localStorage.setItem('userProfile', JSON.stringify(userProfile))
      localStorage.setItem('userPermissions', JSON.stringify(userPermissions))

      return { user: userProfile, permissions: userPermissions }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch user context'
      setError(errorMsg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await apiInstance.post('/auth/login', { email, password })
      const token = response.data?.data?.accessToken || response.data?.data?.token
      
      if (!token) {
        throw new Error('No access token returned')
      }

      // Save token to localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('authToken', token)

      // Fetch user context
      await fetchUserContext()

      return true
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Login failed'
      setError(errorMsg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [fetchUserContext])

  const logout = useCallback(() => {
    setUser(null)
    setPermissions([])
    localStorage.removeItem('token')
    localStorage.removeItem('authToken')
    localStorage.removeItem('userProfile')
    localStorage.removeItem('userPermissions')
  }, [])

  const hasPermission = useCallback((permission) => {
    return permissions.includes(permission)
  }, [permissions])

  const value = {
    user,
    permissions,
    isLoading,
    isAuthLoading,
    error,
    login,
    logout,
    fetchUserContext,
    hasPermission,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
