// TODO: Redis Token Manager Implementation
// 这是一个Redis实现的示例，用于替换内存中的token存储
// 在生产环境中使用此实现可以提高性能和可扩展性

/*
安装Redis依赖：
npm install redis @types/redis

环境变量配置：
REDIS_URL=redis://localhost:6379

主要优势：
1. 支持分布式部署时的token共享
2. 使用Redis的TTL功能自动过期token
3. 更好的性能和可扩展性
4. 支持集群模式

实现步骤：
1. 安装redis依赖
2. 创建Redis连接池
3. 使用Redis的TTL功能自动过期token
4. 支持分布式部署时的token共享
5. 添加错误处理和重连机制

示例代码结构：

import { createClient, RedisClientType } from 'redis';

interface TokenInfo {
  user: any;
  expiresAt: number;
}

export class RedisTokenManager {
  private static instance: RedisTokenManager;
  private redisClient: RedisClientType;
  private isConnected: boolean = false;

  private constructor() {
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            console.error('Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    this.redisClient.on('connect', () => {
      console.log('Redis client connected');
      this.isConnected = true;
    });

    this.redisClient.on('error', (err: Error) => {
      console.error('Redis client error:', err);
      this.isConnected = false;
    });

    this.connect();
  }

  public static async getInstance(): Promise<RedisTokenManager> {
    if (!RedisTokenManager.instance) {
      RedisTokenManager.instance = new RedisTokenManager();
    }
    return RedisTokenManager.instance;
  }

  private async connect(): Promise<void> {
    try {
      await this.redisClient.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
    }
  }

  // 存储token到Redis
  public async storeToken(token: string, user: any, expiresIn: number): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const tokenInfo: TokenInfo = {
        user,
        expiresAt: Date.now() + expiresIn * 1000
      };

      // 使用Redis的TTL功能自动过期
      await this.redisClient.setEx(
        `token:${token}`,
        expiresIn,
        JSON.stringify(tokenInfo)
      );

      console.log('Token stored in Redis:', {
        token: token.substring(0, 20) + '...',
        userId: user?.user_id,
        expiresIn
      });
    } catch (error) {
      console.error('Failed to store token in Redis:', error);
      throw error;
    }
  }

  // 从Redis获取token信息
  public async getTokenInfo(token: string): Promise<TokenInfo | null> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const tokenData = await this.redisClient.get(`token:${token}`);
      
      if (!tokenData) {
        return null;
      }

      const tokenInfo: TokenInfo = JSON.parse(tokenData);
      
      // 检查是否过期
      if (Date.now() > tokenInfo.expiresAt) {
        await this.removeToken(token);
        return null;
      }

      return tokenInfo;
    } catch (error) {
      console.error('Failed to get token from Redis:', error);
      return null;
    }
  }

  // 从Redis删除token
  public async removeToken(token: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      await this.redisClient.del(`token:${token}`);
      console.log('Token removed from Redis:', token.substring(0, 20) + '...');
    } catch (error) {
      console.error('Failed to remove token from Redis:', error);
      throw error;
    }
  }

  // 获取当前存储的token数量
  public async getTokenCount(): Promise<number> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const keys = await this.redisClient.keys('token:*');
      return keys.length;
    } catch (error) {
      console.error('Failed to get token count from Redis:', error);
      return 0;
    }
  }

  // 清理过期的token（Redis会自动处理，但可以手动清理）
  public async cleanupExpiredTokens(): Promise<number> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const keys = await this.redisClient.keys('token:*');
      let cleanedCount = 0;

      for (const key of keys) {
        const tokenData = await this.redisClient.get(key);
        if (tokenData) {
          const tokenInfo: TokenInfo = JSON.parse(tokenData);
          if (Date.now() > tokenInfo.expiresAt) {
            await this.redisClient.del(key);
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} expired tokens from Redis`);
      }

      return cleanedCount;
    } catch (error) {
      console.error('Failed to cleanup expired tokens from Redis:', error);
      return 0;
    }
  }

  // 关闭Redis连接
  public async disconnect(): Promise<void> {
    try {
      await this.redisClient.quit();
      this.isConnected = false;
    } catch (error) {
      console.error('Failed to disconnect from Redis:', error);
    }
  }

  // 检查Redis连接状态
  public isRedisConnected(): boolean {
    return this.isConnected;
  }
}

使用示例：

// 在auth.ts中替换TokenManager的使用
import { RedisTokenManager } from './redisTokenManager';

// 初始化Redis Token Manager
const redisTokenManager = await RedisTokenManager.getInstance();

// 存储token
await redisTokenManager.storeToken(token, user, 24 * 60 * 60);

// 获取token信息
const tokenInfo = await redisTokenManager.getTokenInfo(token);

// 删除token
await redisTokenManager.removeToken(token);

部署注意事项：
1. 确保Redis服务器已安装并运行
2. 配置Redis连接URL环境变量
3. 在生产环境中使用Redis集群或哨兵模式
4. 监控Redis连接状态和性能
5. 定期备份Redis数据
*/ 