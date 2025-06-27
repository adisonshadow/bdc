import { getAuthToken } from './index';

/**
 * 检查 token 是否过期
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    // 解析 JWT token（如果使用 JWT）
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // 检查是否过期
    if (payload.exp && payload.exp < currentTime) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('解析 token 失败:', error);
    return true; // 解析失败认为已过期
  }
};

/**
 * 验证 token 有效性
 */
export const validateToken = async (): Promise<boolean> => {
  const token = getAuthToken();
  
  if (!token) {
    return false;
  }

  // 检查 token 是否过期
  if (isTokenExpired(token)) {
    return false;
  }

  try {
    // 可以在这里添加额外的 token 验证逻辑
    // 比如调用后端 API 验证 token 是否有效
    const response = await fetch('/api/auth/validate', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('验证 token 失败:', error);
    return false;
  }
};

/**
 * 格式化登录 URL
 */
export const formatLoginUrl = (baseUrl: string, appId: string, additionalParams?: Record<string, string>): string => {
  const url = new URL(baseUrl);
  url.searchParams.set('app', appId);
  
  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  
  return url.toString();
}; 