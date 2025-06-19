import { DataSource } from 'typeorm';
import { Logger } from '../utils/logger';
import { createDataSource, getDataSource } from '../data-source';

// 打印数据库配置信息
Logger.info({
  message: '数据库配置信息',
  config: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '5432',
    database: process.env.DB_NAME || 'bdc',
    schema: process.env.DB_SCHEMA || 'bdc',
    username: process.env.DB_USER || 'postgres'
  }
});

// 重试配置
const RETRY_ATTEMPTS = parseInt(process.env.DB_RETRY_ATTEMPTS || '3');
const RETRY_DELAY = parseInt(process.env.DB_RETRY_DELAY || '1000');
const MAX_RETRY_DELAY = parseInt(process.env.DB_MAX_RETRY_DELAY || '10000');

// 数据源初始化函数
export const initializeDatabase = async (): Promise<DataSource> => {
  let attempts = 0;
  let currentDelay = RETRY_DELAY;
  
  while (attempts < RETRY_ATTEMPTS) {
    try {
      // 创建数据源
      const AppDataSource = createDataSource();
      
      // 等待数据库连接
      await AppDataSource.initialize();
      Logger.info({ message: '数据库连接成功' });

      // 检查数据库连接状态
      if (!AppDataSource.isInitialized) {
        throw new Error('数据库连接未初始化');
      }

      // 设置search_path
      await AppDataSource.query('SET search_path TO bdc, public;');
      Logger.info({ message: 'search_path设置成功' });

      // 检查连接池状态
      const pool = (AppDataSource.driver as any).master._clients;
      Logger.info({ message: '当前连接池状态', connections: pool.length });

      return AppDataSource;
    } catch (error) {
      attempts++;
      
      // 详细的错误信息输出到控制台
      console.error('\n========== 数据库连接错误 ==========');
      console.error('错误类型:', error.constructor.name);
      console.error('错误消息:', error.message);
      console.error('错误堆栈:', error.stack);
      console.error('当前配置:');
      console.error('- 主机:', process.env.DB_HOST);
      console.error('- 端口:', process.env.DB_PORT);
      console.error('- 数据库:', process.env.DB_NAME);
      console.error('- Schema:', process.env.DB_SCHEMA);
      console.error('- 用户:', process.env.DB_USER);
      console.error('- 密码:', process.env.DB_PASSWORD ? '已设置' : '未设置');
      console.error('- 当前重试次数:', attempts);
      console.error('- 最大重试次数:', RETRY_ATTEMPTS);
      console.error('================================\n');

      Logger.error({ 
        message: '数据库连接失败', 
        attempt: attempts,
        maxAttempts: RETRY_ATTEMPTS,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error
      });

      if (attempts < RETRY_ATTEMPTS) {
        // 使用指数退避策略计算延迟时间
        currentDelay = Math.min(currentDelay * 2, MAX_RETRY_DELAY);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
      } else {
        throw new Error(`数据库连接失败，已重试 ${RETRY_ATTEMPTS} 次`);
      }
    }
  }

  throw new Error('数据库连接失败，超过最大重试次数');
};

// 关闭数据库连接
export const closeDatabase = async (): Promise<void> => {
  try {
    const AppDataSource = getDataSource();
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      Logger.info({ message: '数据库连接已关闭' });
    }
  } catch (error) {
    Logger.error({ message: '关闭数据库连接失败', error });
  }
}; 