export const DEFAULT_NAME = 'Umi Max';

// 认证相关常量
export const AUTH_HEADER = 'Authorization';
export const AUTH_PREFIX = 'Bearer ';

// 无需token的API路径
export const NO_TOKEN_APIS = [
  '/sso-callback',
  '/sso-success',
  '/api/auth/callback',
  '/api/auth/login',
  '/api/auth/refresh',
];

// 认证相关页面
export const AUTH_PAGES = [
  '/sso-callback',
  '/sso-success',
  '/login',
  '/auth',
  '/',
] as const;
