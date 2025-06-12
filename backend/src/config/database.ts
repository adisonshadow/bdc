import { DataSource } from 'typeorm';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { Logger } from '../utils/logger';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// 根据环境变量设置日志级别
const logLevel = process.env.NODE_ENV === 'production' ? 'error' : 'info';

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

// 数据库连接配置
const dbConfig: PostgresConnectionOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'bdc',
  schema: process.env.DB_SCHEMA || 'bdc',
  namingStrategy: new SnakeNamingStrategy(),
  
  // 连接池配置
  extra: {
    // 连接池配置
    max: parseInt(process.env.DB_POOL_MAX || '20'), // 最大连接数
    min: parseInt(process.env.DB_POOL_MIN || '5'),  // 最小连接数
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'), // 连接超时
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'), // 空闲超时
    
    // PostgreSQL 特定配置
    statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'), // 语句超时
    lock_timeout: parseInt(process.env.DB_LOCK_TIMEOUT || '10000'), // 锁超时
    application_name: 'BDC_APP', // 应用标识
    keepAlive: true, // 保持连接活跃
    keepAliveInitialDelayMillis: 10000, // 保持连接初始延迟
  },

  // 超时设置
  connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000'), // 连接超时

  // 日志配置
  logging: true,
  logger: {
    log: (level: string, message: string) => {
      switch (level) {
        case 'info':
          Logger.info({ message, type: 'database_log' });
          break;
        case 'warn':
          Logger.warn({ message, type: 'database_log' });
          break;
        case 'error':
          Logger.error({ message, type: 'database_log' });
          break;
        default:
          Logger.debug({ message, type: 'database_log' });
      }
    },
    logQuery: (query: string, parameters?: any[]) => {
      if (logLevel === 'info') {
        Logger.debug({ 
          message: 'Database Query', 
          type: 'query',
          query,
          parameters,
          timestamp: new Date().toISOString()
        });
      }
    },
    logQueryError: (error: string | Error, query: string, parameters?: any[]) => {
      const errorDetails = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : { message: error };

      Logger.error({ 
        message: 'Database Query Error', 
        type: 'query_error',
        error: errorDetails,
        query,
        parameters,
        timestamp: new Date().toISOString(),
        database: {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          name: process.env.DB_NAME,
          schema: process.env.DB_SCHEMA,
          user: process.env.DB_USER
        }
      });
    },
    logQuerySlow: (time: number, query: string, parameters?: any[]) => {
      Logger.warn({ 
        message: 'Slow Query Detected', 
        type: 'slow_query',
        executionTime: time,
        query,
        parameters,
        timestamp: new Date().toISOString()
      });
    },
    logSchemaBuild: (message: string) => {
      Logger.info({ 
        message: 'Schema Build Event', 
        type: 'schema_build',
        details: message,
        timestamp: new Date().toISOString()
      });
    },
    logMigration: (message: string) => {
      Logger.info({ 
        message: 'Migration Event', 
        type: 'migration',
        details: message,
        timestamp: new Date().toISOString()
      });
    },
  },

  // 实体和迁移配置
  entities: ['src/models/**/*.ts', 'src/entities/**/*.ts'],
  // migrations: ['src/migrations/**/*.ts'], // 暂时注释掉迁移配置
  migrationsRun: false,  // 禁用自动运行迁移
  migrationsTableName: 'migrations_history',
  migrationsTransactionMode: 'all',
  subscribers: ['src/subscribers/**/*.ts'],

  // 其他配置
  synchronize: false, // 关闭自动同步，使用 SQL 文件定义的表结构
  dropSchema: false,
  // 暂时禁用缓存，详见 DEV_NOTES.md
  cache: false,
};

// 创建数据源实例
// console.log('dbConfig', dbConfig);
export const AppDataSource = new DataSource(dbConfig);

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
      // 等待数据库连接
      await AppDataSource.initialize();
      Logger.info({ message: '数据库连接成功' });

      // 检查数据库连接状态
      if (!AppDataSource.isInitialized) {
        throw new Error('数据库连接未初始化');
      }

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
        message: '数据库连接失败2', 
        attempt: attempts,
        maxAttempts: RETRY_ATTEMPTS,
        error: error instanceof Error ? {
          message: error.message,
          name: error.name,
          stack: error.stack
        } : error,
        config: {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
          schema: process.env.DB_SCHEMA,
          username: process.env.DB_USER
        }
      });
      
      if (attempts >= RETRY_ATTEMPTS) {
        throw error;
      }
      
      currentDelay = Math.min(currentDelay * 2, MAX_RETRY_DELAY);
      Logger.info({ message: '准备重试', delay: currentDelay });
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }
  
  throw new Error('数据库连接失败，已达到最大重试次数');
};

// 优雅关闭函数
export const closeDatabase = async (): Promise<void> => {
  if (AppDataSource.isInitialized) {
    try {
      await AppDataSource.destroy();
      Logger.info({ message: '数据库连接已关闭' });
    } catch (error) {
      Logger.error({ message: '关闭数据库连接时发生错误', error });
      throw error;
    }
  }
}; 