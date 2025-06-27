import { history } from '@umijs/max';
import ssoConfig from './sso.json';

export interface User {
  user_id: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  status: string;
  department_id?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

/**
 * 检查用户是否已登录
 */
export const checkAuthStatus = (): AuthState => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return {
      isAuthenticated: false,
      user: null,
      token: null,
    };
  }

  try {
    const user = JSON.parse(userStr) as User;
    return {
      isAuthenticated: true,
      user,
      token,
    };
  } catch (error) {
    console.error('解析用户信息失败:', error);
    // 清除无效的用户信息
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return {
      isAuthenticated: false,
      user: null,
      token: null,
    };
  }
};

/**
 * 跳转到登录页
 */
export const redirectToLogin = () => {
  const loginUrl = `${ssoConfig['sso-auth-url']}?app=${ssoConfig.app}`;
  window.location.href = loginUrl;
};

/**
 * 登出
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  redirectToLogin();
};

/**
 * 保存用户认证信息
 */
export const saveAuthInfo = (token: string, user: User) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = (): User | null => {
  const authState = checkAuthStatus();
  return authState.user;
};

/**
 * 获取认证 token
 */
export const getAuthToken = (): string | null => {
  const authState = checkAuthStatus();
  return authState.token;
};

/**
 * 检查是否需要认证
 */
export const requireAuth = (): boolean => {
  const authState = checkAuthStatus();
  
  if (!authState.isAuthenticated) {
    redirectToLogin();
    return false;
  }
  
  return true;
}; 