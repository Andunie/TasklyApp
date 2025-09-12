import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const normalizeUser = (apiUser) => {
    if (!apiUser) return null;
    
    return {
      id: apiUser.UserId ?? apiUser.id ?? apiUser.userId,
      fullName: apiUser.FullName ?? apiUser.fullName ?? apiUser.name,
      email: apiUser.Email ?? apiUser.email,
      role: apiUser.Role ?? apiUser.role ?? 'User',
    };
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await apiClient.get('/api/Auth/me');
        setUser(normalizeUser(response.data));
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async ({ email, password, rememberMe }) => {
    const response = await apiClient.post('/api/Auth/login', { email, password, rememberMe });
    const authUser = normalizeUser(response.data);
    setUser(authUser);
    return authUser;
  };

  const register = async ({ fullName, email, password }) => {
    const response = await apiClient.post('/api/Auth/register', { fullName, email, password });
    return response.data;
  };

  const logout = async () => {
    await apiClient.post('/api/Auth/logout');
    setUser(null);
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const isTeamLeader = user?.role === 'TeamLeader' || user?.role === 'Admin';
  const isAdmin = user?.role === 'Admin';

  const value = useMemo(() => ({ 
    user, 
    isLoading, 
    login, 
    register, 
    logout, 
    hasRole, 
    isTeamLeader, 
    isAdmin 
  }), [user, isLoading, isTeamLeader, isAdmin]);
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}