import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 扩展 Request 类型以包含 user 属性
declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: string;
        username: string;
        name: string;
        avatar?: string;
        email: string;
        phone?: string;
        gender?: string;
        status: string;
        department_id?: string;
        sso_token?: {
          access_token: string;
          refresh_token: string;
          token_type: string;
          expires_in: number;
          state: string;
        };
      };
    }
  }
}

// 内存中的token存储
// TODO: 在生产环境中应该使用Redis来存储token，以提高性能和可扩展性
// Redis实现方式：
// 1. 安装redis依赖: npm install redis
// 2. 创建Redis连接池
// 3. 使用Redis的TTL功能自动过期token
// 4. 支持分布式部署时的token共享
interface TokenInfo {
  user: Express.Request['user'];
  expiresAt: number;
}

class TokenManager {
  private static instance: TokenManager;
  private tokenStore: Map<string, TokenInfo> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    // 每5分钟清理一次过期的token
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredTokens();
    }, 5 * 60 * 1000);
  }

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  // 存储token
  public storeToken(token: string, user: Express.Request['user'], expiresIn: number): void {
    const expiresAt = Date.now() + expiresIn * 1000;
    this.tokenStore.set(token, {
      user,
      expiresAt
    });
    
    console.log('Token stored in memory:', {
      token: token.substring(0, 20) + '...',
      userId: user?.user_id,
      expiresAt: new Date(expiresAt).toISOString()
    });
  }

  // 获取token信息
  public getTokenInfo(token: string): TokenInfo | null {
    const tokenInfo = this.tokenStore.get(token);
    
    if (!tokenInfo) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > tokenInfo.expiresAt) {
      this.tokenStore.delete(token);
      console.log('Token expired and removed:', token.substring(0, 20) + '...');
      return null;
    }

    return tokenInfo;
  }

  // 删除token
  public removeToken(token: string): void {
    this.tokenStore.delete(token);
    console.log('Token removed from memory:', token.substring(0, 20) + '...');
  }

  // 清理过期的token
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [token, tokenInfo] of this.tokenStore.entries()) {
      if (now > tokenInfo.expiresAt) {
        this.tokenStore.delete(token);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired tokens`);
    }
  }

  // 获取当前存储的token数量
  public getTokenCount(): number {
    return this.tokenStore.size;
  }

  // 销毁实例（用于测试）
  public destroy(): void {
    clearInterval(this.cleanupInterval);
    this.tokenStore.clear();
  }
}

// 获取TokenManager实例
const tokenManager = TokenManager.getInstance();

// 从JWT token中提取用户信息并存储到内存中
export const processJWTToken = (token: string): Express.Request['user'] | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    // 检查token是否已经在内存中
    const existingTokenInfo = tokenManager.getTokenInfo(token);
    if (existingTokenInfo) {
      console.log('Token found in memory cache');
      return existingTokenInfo.user;
    }

    // 如果不在内存中，将用户信息存储到内存中
    const user: Express.Request['user'] = {
      user_id: decoded.user_id,
      username: decoded.username,
      name: decoded.name,
      avatar: decoded.avatar,
      email: decoded.email,
      phone: decoded.phone,
      gender: decoded.gender,
      status: decoded.status,
      department_id: decoded.department_id,
      sso_token: decoded.sso_token
    };

    // 存储到内存中，设置24小时过期
    tokenManager.storeToken(token, user, 24 * 60 * 60);
    
    return user;
  } catch (error) {
    console.error('JWT token verification failed:', error);
    return null;
  }
};

// 认证中间件
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided for:', req.path);
    res.status(401).json({
      success: false,
      message: '未提供认证令牌',
      code: 'NO_TOKEN'
    });
    return;
  }

  try {
    // 使用新的token处理方式
    const user = processJWTToken(token);
    
    if (!user) {
      console.log('Invalid token for:', req.path);
      res.status(401).json({
        success: false,
        message: '无效的认证令牌',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    req.user = user;
    console.log('Authentication successful for:', req.path, 'user:', user.username);
    next();
  } catch (error) {
    console.error('Authentication failed for:', req.path, error);
    res.status(401).json({
      success: false,
      message: '无效的认证令牌',
      code: 'AUTH_ERROR'
    });
    return;
  }
};

// 导出TokenManager用于测试和管理
export { TokenManager }; 