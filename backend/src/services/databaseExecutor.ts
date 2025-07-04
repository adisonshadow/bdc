import { Client } from 'pg';
import { DatabaseConnection } from '../models/DatabaseConnection';

export interface DatabaseExecutorResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class DatabaseExecutor {
  private client: Client | null = null;

  async connect(connection: DatabaseConnection): Promise<DatabaseExecutorResult> {
    try {
      // 关闭现有连接
      if (this.client) {
        await this.client.end();
      }

      // 解密密码
      const password = await connection.decryptPassword();

      // 创建新的数据库连接
      this.client = new Client({
        host: connection.host,
        port: connection.port,
        database: connection.database,
        user: connection.username,
        password: password || '',
        ssl: connection.sslConfig?.enabled ? {
          rejectUnauthorized: false,
          ...connection.sslConfig
        } : false
      });

      await this.client.connect();
      
      return {
        success: true,
        message: '数据库连接成功'
      };
    } catch (error) {
      console.error('数据库连接失败:', error);
      return {
        success: false,
        message: '数据库连接失败',
        error: error.message
      };
    }
  }

  async executeSQL(sql: string): Promise<DatabaseExecutorResult> {
    if (!this.client) {
      return {
        success: false,
        message: '数据库未连接',
        error: '请先建立数据库连接'
      };
    }

    try {
      console.log('执行SQL:', sql);
      
      // 开始事务
      await this.client.query('BEGIN');
      
      // 执行SQL
      const result = await this.client.query(sql);
      
      // 提交事务
      await this.client.query('COMMIT');
      
      console.log('SQL执行成功:', result);
      return {
        success: true,
        message: 'SQL执行成功',
        data: result
      };
    } catch (error) {
      console.error('SQL执行失败:', error);
      
      // 回滚事务
      try {
        await this.client!.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('事务回滚失败:', rollbackError);
      }
      
      return {
        success: false,
        message: 'SQL执行失败',
        error: error.message
      };
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }

  async testConnection(connection: DatabaseConnection): Promise<DatabaseExecutorResult> {
    try {
      const connectResult = await this.connect(connection);
      if (!connectResult.success) {
        return connectResult;
      }

      // 执行简单的测试查询
      const testResult = await this.executeSQL('SELECT 1 as test');
      await this.disconnect();

      return testResult;
    } catch (error) {
      await this.disconnect();
      return {
        success: false,
        message: '连接测试失败',
        error: error.message
      };
    }
  }
} 