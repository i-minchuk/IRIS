/* eslint-disable react-refresh/only-export-components */
import { createContext, useState } from 'react';

import type { ReactNode } from 'react';


interface User {
  id: number;
  email: string;
  full_name?: string;
  username?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, _password: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('stdo-user');
    if (!saved) return null;

    try {
      return JSON.parse(saved) as User;
    } catch {
      localStorage.removeItem('stdo-user');
      return null;
    }
  });
  const [loading] = useState(false);

  const login = async (email: string, password: string) => {
    void password;

    const mockUser: User = {
      id: 1,
      email,
      username: email.split('@')[0],
      full_name: 'Администратор',
      role: 'admin',
    };
    setUser(mockUser);
    localStorage.setItem('stdo-user', JSON.stringify(mockUser));
  };

  const loginDemo = async () => {
    const demoUser: User = {
      id: 1,
      email: 'demo@stdo.local',
      username: 'demo',
      full_name: 'Demo User',
      role: 'admin',
    };
    setUser(demoUser);
    localStorage.setItem('stdo-user', JSON.stringify(demoUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('stdo-user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        loading,
        login,
        loginDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

