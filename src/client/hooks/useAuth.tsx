'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { api, setToken, getToken } from '../services/api';

export interface AuthContextValue {
  user: any | null;
  setUser: Dispatch<SetStateAction<any | null>>;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  registerCompany: (payload: any) => Promise<any>;
  registerCandidate: (payload: any) => Promise<any>;
  setPasswordWithToken: (token: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children?: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      const { user } = await api.get('/auth/me');
      setUser(user);
    } catch {
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (email: string, password: string) => {
    const { user, token } = await api.post('/auth/login', { email, password });
    setToken(token);
    setUser(user);
    return user;
  };

  const registerCompany = async (payload) => {
    const { user, token } = await api.post('/auth/register/company', payload);
    setToken(token);
    setUser(user);
    return user;
  };

  const registerCandidate = async (payload) => {
    const { user, token } = await api.post('/auth/register/candidate', payload);
    setToken(token);
    setUser(user);
    return user;
  };

  // Build plan P1: invite link → choose a password → logged straight in.
  const setPasswordWithToken = async (token: string, password: string) => {
    const { user, token: jwt } = await api.post('/auth/set-password', { token, password });
    setToken(jwt);
    setUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  // <AuthContext.Provider value={{ user, setUser, loading, login, registerCompany, registerCandidate, logout }}>
  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, login, registerCompany, registerCandidate, setPasswordWithToken, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
