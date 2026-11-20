import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AuthResponse } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (payload: any) => Promise<AuthResponse>;
  logout: () => void;
  setAuthSession: (authData: AuthResponse) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('agrosync_token'));
  const [role, setRole] = useState<UserRole | null>(
    (localStorage.getItem('agrosync_role') as UserRole) || null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('agrosync_token');
      if (storedToken) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
          setRole(userData.role);
          setToken(storedToken);
        } catch (err) {
          console.error("Auth check failed:", err);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const setAuthSession = (authData: AuthResponse) => {
    localStorage.setItem('agrosync_token', authData.access_token);
    localStorage.setItem('agrosync_role', authData.role);
    setToken(authData.access_token);
    setRole(authData.role);
    setUser({
      id: authData.user_id,
      email: authData.email,
      full_name: authData.full_name,
      role: authData.role,
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString()
    });
  };

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    const data = await authService.login(email, password);
    setAuthSession(data);
    return data;
  };

  const register = async (payload: any): Promise<AuthResponse> => {
    const data = await authService.register(payload);
    setAuthSession(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('agrosync_token');
    localStorage.removeItem('agrosync_role');
    localStorage.removeItem('agrosync_user');
    setUser(null);
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isLoading,
        login,
        register,
        logout,
        setAuthSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
