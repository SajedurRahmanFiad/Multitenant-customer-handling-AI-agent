import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setApiToken } from '../lib/api';
import type { CurrentUser } from '../types/auth';

export interface TenantSummary {
  id: string;
  businessName: string;
  status?: string;
}

interface AuthContextValue {
  user: CurrentUser | null;
  availableTenants: TenantSummary[];
  booting: boolean;
  loggingIn: boolean;
  loginError: string | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface LoginResponse {
  token: string;
  sessionId: string;
  user: CurrentUser;
}

interface MeResponse {
  user: CurrentUser & { availableTenants?: TenantSummary[] };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [availableTenants, setAvailableTenants] = useState<TenantSummary[]>([]);
  const [booting, setBooting] = useState<boolean>(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const applyMe = useCallback((payload: MeResponse) => {
    const { availableTenants: ats, ...u } = payload.user;
    setUser(u);
    setAvailableTenants(ats ?? []);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const me = await api.get<MeResponse>('/auth/me');
      applyMe(me);
    } catch (err: unknown) {
      setApiToken(null);
      setUser(null);
      setAvailableTenants([]);
      setLoginError(err instanceof Error && err.message === 'Business is suspended' ? err.message : null);
    }
  }, [applyMe]);

  useEffect(() => {
    const handleBusinessSuspended = (event: Event) => {
      const { message } = (event as CustomEvent<{ message: string }>).detail;
      setApiToken(null);
      setUser(null);
      setAvailableTenants([]);
      setLoginError(message);
    };
    window.addEventListener('auth:business-suspended', handleBusinessSuspended);
    return () => window.removeEventListener('auth:business-suspended', handleBusinessSuspended);
  }, []);

  useEffect(() => {
    refresh().finally(() => setBooting(false));
  }, [refresh]);

  useEffect(() => {
    if (!user || user.role === 'super_admin') return;
    const intervalId = window.setInterval(() => { void refresh(); }, 15000);
    return () => window.clearInterval(intervalId);
  }, [user?.id, user?.tenantId, user?.role, refresh]);

  const login = useCallback(
    async (identifier: string, password: string): Promise<boolean> => {
      setLoggingIn(true);
      setLoginError(null);
      try {
        const res = await api.post<LoginResponse>('/auth/login', { identifier, password });
        setApiToken(res.token);
        await refresh();
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Login failed. Please try again.';
        setLoginError(message);
        return false;
      } finally {
        setLoggingIn(false);
      }
    },
    [refresh]
  );

  const logout = useCallback(() => {
    api.post('/auth/logout').catch(() => undefined);
    setApiToken(null);
    setUser(null);
    setAvailableTenants([]);
    setLoginError(null);
  }, []);

  const value = useMemo(
    () => ({ user, availableTenants, booting, loggingIn, loginError, login, logout, refresh }),
    [user, availableTenants, booting, loggingIn, loginError, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
