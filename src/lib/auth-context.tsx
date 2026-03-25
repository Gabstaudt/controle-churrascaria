import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, getUsers, initDefaultAdmin } from './store';

interface AuthState {
  user: User | null;
  accessType: 'employee' | 'admin' | null;
}

interface AuthContextType extends AuthState {
  login: (code: string, password: string) => boolean;
  selectAccess: (type: 'employee' | 'admin') => void;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, accessType: null });

  useEffect(() => { initDefaultAdmin(); }, []);

  const login = useCallback((code: string, password: string) => {
    const users = getUsers();
    const user = users.find(u => u.code === code && u.password === password && u.status === 'active');
    if (user) { setState({ user, accessType: null }); return true; }
    return false;
  }, []);

  const selectAccess = useCallback((type: 'employee' | 'admin') => {
    setState(prev => ({ ...prev, accessType: type }));
  }, []);

  const logout = useCallback(() => {
    setState({ user: null, accessType: null });
  }, []);

  const refreshUser = useCallback(() => {
    if (state.user) {
      const users = getUsers();
      const updated = users.find(u => u.id === state.user!.id);
      if (updated) setState(prev => ({ ...prev, user: updated }));
    }
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, selectAccess, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
