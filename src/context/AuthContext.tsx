import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getAuthToken, removeAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identificador: string, pass: string) => Promise<void>;
  register: (data: {
    nombre: string;
    apellido: string;
    nombre_usuario: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isAlumno: boolean;
  isVisitor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const currentToken = getAuthToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch {
      removeAuthToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (identificador: string, pass: string) => {
    const res = await api.login(identificador, pass);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (data: {
    nombre: string;
    apellido: string;
    nombre_usuario: string;
    email: string;
    password: string;
  }) => {
    const res = await api.register(data);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    removeAuthToken();
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.rol === 'ADMINISTRADOR';
  const isAlumno = user?.rol === 'ALUMNO';
  const isVisitor = !user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        isAdmin,
        isAlumno,
        isVisitor,
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
