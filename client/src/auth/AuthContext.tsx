import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api, getSessionUserId, setSessionUserId } from '../api/client';
import type { User } from '../api/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (userId: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/** MOCK login: stores the id of the chosen preloaded user. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getSessionUserId()) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => setSessionUserId(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (userId: string) => {
    const { user } = await api.login(userId);
    setSessionUserId(user.id);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    setSessionUserId(null);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
