import React, { useEffect } from 'react';
import { Spin } from 'antd';
import { useAuth } from './AuthProvider';
import { redirectToLogin } from './index';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, authState } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      redirectToLogin();
    }
  }, [isAuthenticated]);

  // 如果未认证，显示加载状态（实际上会很快跳转到登录页）
  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" tip="正在跳转到登录页..." />
      </div>
    );
  }

  return <>{children}</>;
}; 