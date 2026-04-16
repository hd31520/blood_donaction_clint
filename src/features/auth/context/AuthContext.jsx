import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { setApiAuthToken } from '../../../services/apiClient.js';
import { authService } from '../services/authService.js';
import { tokenStorage } from '../utils/tokenStorage.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const savedToken = tokenStorage.get();
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      setApiAuthToken(savedToken);

      try {
        const me = await authService.getMe();
        setUser(me);
        setToken(savedToken);
      } catch (error) {
        tokenStorage.clear();
        setApiAuthToken(null);
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const refreshUser = async () => {
    const me = await authService.getMe();
    setUser(me);
    return me;
  };

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    tokenStorage.set(data.token);
    setApiAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await authService.register(payload);
    tokenStorage.set(data.token);
    setApiAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    tokenStorage.clear();
    setApiAuthToken(null);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [isLoading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
