import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { checkAuthStatus, User, AuthState } from './index';

interface AuthContextType {
  authState: AuthState;
  setAuthState: (state: AuthState) => void;
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => checkAuthStatus());

  useEffect(() => {
    // 初始化时检查认证状态
    const currentAuthState = checkAuthStatus();
    setAuthState(currentAuthState);
  }, []);

  const value: AuthContextType = {
    authState,
    setAuthState,
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    token: authState.token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 