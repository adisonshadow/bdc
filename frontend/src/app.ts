// 运行时配置
import { checkAuthStatus, User, redirectToLogin } from './auth';

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
    if (!currentPath.includes('/sso-callback') && !currentPath.includes('/sso-test')) {
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
        colorPrimary: '#6604e7',
      },
    },
  };
};
