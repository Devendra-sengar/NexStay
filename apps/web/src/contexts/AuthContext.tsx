import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { AuthUser, Role } from '@nexstay/shared';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isHostelAdmin: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    api.post('/auth/logout').catch(() => {}); // best-effort
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setIsLoading(false); return; }

    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => logout())
      .finally(() => setIsLoading(false));
  }, [logout]);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    return data.user;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token: localStorage.getItem('accessToken'),
      isLoading,
      isAuthenticated: !!user,
      isGuest: user?.role === Role.GUEST,
      isHostelAdmin: user?.role === Role.HOSTEL_ADMIN,
      isSuperAdmin: user?.role === Role.SUPER_ADMIN,
      login,
      logout,
      setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
