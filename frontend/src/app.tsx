// 运行时配置
import { checkAuthStatus, User, redirectToLogin, logout } from './auth';
import ssoConfig from './auth/sso.json';
import React from 'react';

// 全局初始化数据配置，用于 Layout 用户信息和权限初始化
// 更多信息见文档：https://umijs.org/docs/api/runtime-config#getinitialstate
export async function getInitialState(): Promise<{ 
  name: string;
  user: User | null;
  isAuthenticated: boolean;
}> {
  const authState = checkAuthStatus();
  
  // 如果未认证且不在SSO回调页面，则跳转到登录页
  if (!authState.isAuthenticated) {
    const currentPath = window.location.pathname;
    if (!currentPath.includes('/sso-callback') && 
        !currentPath.includes('/sso-success')) {
      redirectToLogin();
    }
  }
    
  return { 
    name: authState.user?.name || 'admin',
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
  };
}

// 忽略 findDOMNode 警告
const originalError = console.error;
console.error = (...args) => {
  if (args[0]?.includes('is deprecated') || 
      args[0]?.includes('net::ERR_FILE_NOT_FOUND') ||
      args[0]?.includes('Unchecked runtime.lastError: The message port closed before a response was received.')) {
    return;
  }
  originalError.call(console, ...args);
};

export const layout = () => {
  return {
    logo: '/logo.svg',
    layout: 'top',
    //fixedHeader: true,
    locale: false,
    theme: {
      token: {
        colorPrimary: '#161df1',
      },
    },
    rightRender: (initialState: any, setInitialState: any, runtimeConfig: any) => {
      const handleUserCenterClick = () => {
        // 跳转到SSO用户中心
        const userCenterUrl = `${ssoConfig.sso_domain}${ssoConfig['sso-usercenter-path']}?app=${ssoConfig.app}`;
        window.location.href = userCenterUrl;
      };

      // 获取头像URL
      const getAvatarUrl = () => {
        console.log('initialState:', initialState);
        console.log('initialState.user:', initialState?.user);
        console.log('initialState.user.avatar:', initialState?.user?.avatar);
        if (initialState?.user?.avatar) {
          // 如果有头像，使用API获取图片
          return `${ssoConfig.sso_domain}/api/v1/uploads/images/${initialState.user.avatar}`;
        }
        // 默认头像
        return '/avatar.svg';
      };

      return (
        <div className="umi-plugin-layout-right anticon" style={{ display: 'flex', alignItems: 'center' }}>
          <span 
            className="umi-plugin-layout-action" 
            style={{ cursor: 'pointer' }}
            onClick={handleUserCenterClick}
          >
            <img
              src={getAvatarUrl()}
              alt="avatar"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                marginRight: '4px'
              }}
              onError={(e) => {
                // 如果头像加载失败，使用默认头像
                (e.target as HTMLImageElement).src = '/avatar.svg';
              }}
            />
            <span className="umi-plugin-layout-name">
              {initialState?.name}
            </span>
          </span>
        </div>
      );
    }
  };
};
