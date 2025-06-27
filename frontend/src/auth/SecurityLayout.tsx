import React, { useEffect } from 'react';
import { Spin } from 'antd';
import { useModel } from '@umijs/max';
import { redirectToLogin } from './index';

interface SecurityLayoutProps {
  children: React.ReactNode;
}

export const SecurityLayout: React.FC<SecurityLayoutProps> = ({ children }) => {
  const { initialState } = useModel('@@initialState');
  const { isAuthenticated } = initialState || {};

  useEffect(() => {
    // 如果未认证，跳转到登录页
    if (isAuthenticated === false) {
      redirectToLogin();
    }
  }, [isAuthenticated]);

  // 如果正在检查认证状态或未认证，显示加载状态
  if (isAuthenticated === false) {
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

  // 如果认证状态还未确定，显示加载状态
  if (isAuthenticated === undefined) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" tip="正在检查登录状态..." />
      </div>
    );
  }

  // 已认证，渲染子组件
  return <>{children}</>;
}; 