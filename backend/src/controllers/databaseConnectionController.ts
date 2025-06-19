import { Request, Response } from 'express';
import { getDataSource } from '../data-source';
import { DatabaseConnection, ConnectionStatus, DatabaseType } from '../models/DatabaseConnection';
import { validatePasswordStrength } from '../utils/crypto';
import { Client } from 'pg';
import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';
import sql from 'mssql';
import oracledb, { Connection as OracleConnection } from 'oracledb';
 
export class DatabaseConnectionController {
  // 创建数据库连接
  async create(req: Request, res: Response) {
    try {
      const repository = getDataSource().getRepository(DatabaseConnection);
      const {
        name,
        description,
        type,
        host,
        port,
        database,
        username,
        password,
        schema,
        sslConfig,
        poolConfig,
        monitorConfig,
        allowRemote,
        allowedIps
      } = req.body;

      // 验证必填字段
      if (!name || !type || !host || !port || !database || !username || !password) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段'
        });
      }

      // 验证密码强度
      const passwordStrength = validatePasswordStrength(password);
      if (passwordStrength < 60) {
        return res.status(400).json({
          success: false,
          message: '密码强度不足，请使用更复杂的密码'
        });
      }

      // 检查连接名称是否已存在
      const existingConnection = await repository.findOne({ where: { name } });
      if (existingConnection) {
        return res.status(400).json({
          success: false,
          message: '连接名称已存在'
        });
      }

      // 创建新连接
      const connection = new DatabaseConnection();
      Object.assign(connection, {
        name,
        description,
        type,
        host,
        port,
        database,
        username,
        password,
        schema,
        sslConfig,
        poolConfig,
        monitorConfig,
        allowRemote,
        allowedIps,
        status: ConnectionStatus.INACTIVE
      });

      // 加密密码
      await connection.encryptPassword();

      // 保存连接
      const savedConnection = await repository.save(connection);

      // 返回结果（不包含密码）
      const { password: _, ...result } = savedConnection;
      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('创建数据库连接失败:', error);
      return res.status(500).json({
        success: false,
        message: '创建数据库连接失败'
      });
    }
  }

  // 获取数据库连接列表
  async list(req: Request, res: Response) {
    try {
      const repository = getDataSource().getRepository(DatabaseConnection);
      const { page = 1, limit = 10, type, status, isActive } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // 构建查询条件
      const where: any = {};
      if (type) where.type = type;
      if (status) where.status = status;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      // 查询数据
      const [connections, total] = await repository.findAndCount({
        where,
        skip,
        take: Number(limit),
        order: { createdAt: 'DESC' },
        select: ['id', 'name', 'description', 'type', 'host', 'port', 'database', 'username', 'schema', 'status', 'allowRemote', 'lastTestAt', 'lastTestSuccess', 'isActive', 'createdAt', 'updatedAt']
      });

      return res.json({
        success: true,
        data: {
          items: connections,
          total,
          page: Number(page),
          limit: Number(limit)
        }
      });
    } catch (error) {
      console.error('获取数据库连接列表失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取数据库连接列表失败'
      });
    }
  }

  // 获取单个数据库连接
  async get(req: Request, res: Response) {
    try {
      const repository = getDataSource().getRepository(DatabaseConnection);
      const { id } = req.params;
      const connection = await repository.findOne({
        where: { id },
        select: ['id', 'name', 'description', 'type', 'host', 'port', 'database', 'username', 'schema', 'sslConfig', 'poolConfig', 'monitorConfig', 'status', 'allowRemote', 'allowedIps', 'lastTestAt', 'lastTestSuccess', 'lastTestError', 'stats', 'isActive', 'createdAt', 'updatedAt']
      });

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: '数据库连接不存在'
        });
      }

      return res.json({
        success: true,
        data: connection
      });
    } catch (error) {
      console.error('获取数据库连接失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取数据库连接失败'
      });
    }
  }

  // 更新数据库连接
  async update(req: Request, res: Response) {
    try {
      const repository = getDataSource().getRepository(DatabaseConnection);
      const { id } = req.params;
      const {
        name,
        description,
        host,
        port,
        database,
        username,
        password,
        schema,
        sslConfig,
        poolConfig,
        monitorConfig,
        allowRemote,
        allowedIps,
        isActive
      } = req.body;

      // 查找连接
      const connection = await repository.findOne({ where: { id } });
      if (!connection) {
        return res.status(404).json({
          success: false,
          message: '数据库连接不存在'
        });
      }

      // 如果修改了名称，检查是否重复
      if (name && name !== connection.name) {
        const existingConnection = await repository.findOne({ where: { name } });
        if (existingConnection) {
          return res.status(400).json({
            success: false,
            message: '连接名称已存在'
          });
        }
      }

      // 如果修改了密码，验证密码强度
      if (password) {
        const passwordStrength = validatePasswordStrength(password);
        if (passwordStrength < 60) {
          return res.status(400).json({
            success: false,
            message: '密码强度不足，请使用更复杂的密码'
          });
        }
        connection.password = password;
        await connection.encryptPassword();
      }

      // 更新其他字段
      Object.assign(connection, {
        name,
        description,
        host,
        port,
        database,
        username,
        schema,
        sslConfig,
        poolConfig,
        monitorConfig,
        allowRemote,
        allowedIps,
        isActive
      });

      // 保存更新
      const updatedConnection = await repository.save(connection);

      // 返回结果（不包含密码）
      const { password: _, ...result } = updatedConnection;
      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('更新数据库连接失败:', error);
      return res.status(500).json({
        success: false,
        message: '更新数据库连接失败'
      });
    }
  }

  // 删除数据库连接
  async delete(req: Request, res: Response) {
    try {
      const repository = getDataSource().getRepository(DatabaseConnection);
      const { id } = req.params;
      const connection = await repository.findOne({ where: { id } });

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: '数据库连接不存在'
        });
      }

      // 检查连接是否在使用中
      if (connection.status === ConnectionStatus.ACTIVE) {
        return res.status(400).json({
          success: false,
          message: '无法删除正在使用的数据库连接'
        });
      }

      await repository.remove(connection);

      return res.json({
        success: true,
        message: '数据库连接已删除'
      });
    } catch (error) {
      console.error('删除数据库连接失败:', error);
      return res.status(500).json({
        success: false,
        message: '删除数据库连接失败'
      });
    }
  }

  // 测试数据库连接
  async testConnection(req: Request, res: Response) {
    try {
      const repository = getDataSource().getRepository(DatabaseConnection);
      const { id } = req.params;
      const connection = await repository.findOne({ where: { id } });

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: '数据库连接不存在'
        });
      }

      // 更新状态为测试中
      connection.status = ConnectionStatus.TESTING;
      await repository.save(connection);

      try {
        // 解密密码
        const password = await connection.decryptPassword();

        // 根据数据库类型测试连接
        let connectionInfo: any = {};
        switch (connection.type) {
          case DatabaseType.POSTGRESQL:
            connectionInfo = await this.testPostgreSQLConnection(connection, password);
            break;
          case DatabaseType.MYSQL:
            connectionInfo = await this.testMySQLConnection(connection, password);
            break;
          case DatabaseType.MONGODB:
            connectionInfo = await this.testMongoDBConnection(connection, password);
            break;
          case DatabaseType.SQLSERVER:
            connectionInfo = await this.testSQLServerConnection(connection, password);
            break;
          case DatabaseType.ORACLE:
            connectionInfo = await this.testOracleConnection(connection, password);
            break;
          default:
            throw new Error('不支持的数据库类型');
        }

        // 更新连接状态
        connection.status = ConnectionStatus.ACTIVE;
        connection.lastTestAt = new Date();
        connection.lastTestSuccess = true;
        connection.lastTestError = null;
        await repository.save(connection);

        return res.json({
          success: true,
          message: '连接测试成功',
          data: connectionInfo
        });
      } catch (error) {
        // 更新连接状态
        connection.status = ConnectionStatus.FAILED;
        connection.lastTestAt = new Date();
        connection.lastTestSuccess = false;
        connection.lastTestError = error.message;
        await repository.save(connection);

        throw error;
      }
    } catch (error) {
      console.error('测试数据库连接失败:', error);
      return res.status(500).json({
        success: false,
        message: `测试数据库连接失败: ${error.message}`
      });
    }
  }

  // 测试 PostgreSQL 连接
  private async testPostgreSQLConnection(connection: DatabaseConnection, password: string) {
    const client = new Client({
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.username,
      password: password,
      ssl: connection.sslConfig?.enabled ? {
        rejectUnauthorized: connection.sslConfig.verifyServerCert,
        ca: connection.sslConfig.caCert,
        cert: connection.sslConfig.clientCert,
        key: connection.sslConfig.clientKey
      } : false
    });

    try {
      await client.connect();
      const versionResult = await client.query('SELECT version()');
      const statsResult = await client.query(`
        SELECT 
          current_setting('max_connections')::int as max_connections,
          count(*) as current_connections
        FROM pg_stat_activity
      `);

      return {
        version: versionResult.rows[0].version,
        serverTime: new Date(),
        maxConnections: statsResult.rows[0].max_connections,
        currentConnections: statsResult.rows[0].current_connections
      };
    } finally {
      await client.end();
    }
  }

  // 测试 MySQL 连接
  private async testMySQLConnection(connection: DatabaseConnection, password: string) {
    const client = await mysql.createConnection({
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.username,
      password: password,
      ssl: connection.sslConfig?.enabled ? {
        rejectUnauthorized: connection.sslConfig.verifyServerCert,
        ca: connection.sslConfig.caCert,
        cert: connection.sslConfig.clientCert,
        key: connection.sslConfig.clientKey
      } : undefined
    });

    try {
      const [versionRows] = await client.query('SELECT VERSION() as version');
      const [maxConnRows] = await client.query('SHOW VARIABLES LIKE "max_connections"');
      const [currentConnRows] = await client.query('SELECT COUNT(*) as count FROM information_schema.processlist');

      return {
        version: (versionRows as any[])[0]?.version || 'unknown',
        serverTime: new Date(),
        maxConnections: parseInt((maxConnRows as any[])[0]?.Value || '0', 10),
        currentConnections: parseInt((currentConnRows as any[])[0]?.count || '0', 10)
      };
    } finally {
      await client.end();
    }
  }

  // 测试 MongoDB 连接
  private async testMongoDBConnection(connection: DatabaseConnection, password: string) {
    // 构建带有 SSL 选项的 MongoDB URI
    const sslOptions = connection.sslConfig?.enabled ? [
      'ssl=true',
      connection.sslConfig.verifyServerCert ? 'tlsAllowInvalidCertificates=false' : 'tlsAllowInvalidCertificates=true',
      connection.sslConfig.caCert ? `tlsCAFile=${encodeURIComponent(connection.sslConfig.caCert)}` : '',
      connection.sslConfig.clientCert && connection.sslConfig.clientKey 
        ? `tlsCertificateKeyFile=${encodeURIComponent(`${connection.sslConfig.clientCert}\n${connection.sslConfig.clientKey}`)}`
        : ''
    ].filter(Boolean).join('&') : '';

    const url = `mongodb://${connection.username}:${password}@${connection.host}:${connection.port}/${connection.database}${sslOptions ? `?${sslOptions}` : ''}`;
    const client = new MongoClient(url);

    try {
      await client.connect();
      await client.db(connection.database).command({ ping: 1 });
      return { success: true };
    } finally {
      await client.close();
    }
  }

  // 测试 SQL Server 连接
  private async testSQLServerConnection(connection: DatabaseConnection, password: string) {
    const config = {
      server: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.username,
      password: password,
      options: {
        encrypt: connection.sslConfig?.enabled,
        trustServerCertificate: !connection.sslConfig?.verifyServerCert
      }
    };

    let pool;
    try {
      pool = await sql.connect(config);
      const versionResult = await pool.request().query('SELECT @@VERSION as version');
      const statsResult = await pool.request().query(`
        SELECT 
          @@MAX_CONNECTIONS as max_connections,
          COUNT(*) as current_connections
        FROM sys.dm_exec_sessions
      `);

      return {
        version: versionResult.recordset[0].version,
        serverTime: new Date(),
        maxConnections: statsResult.recordset[0].max_connections,
        currentConnections: statsResult.recordset[0].current_connections
      };
    } finally {
      if (pool) {
        await pool.close();
      }
    }
  }

  // 测试 Oracle 连接
  private async testOracleConnection(dbConnection: DatabaseConnection, password: string) {
    const config = {
      user: dbConnection.username,
      password: password,
      connectString: `${dbConnection.host}:${dbConnection.port}/${dbConnection.database}`,
      walletLocation: dbConnection.sslConfig?.enabled ? dbConnection.sslConfig.caCert : undefined
    };

    let oracleConn;
    try {
      oracleConn = await oracledb.getConnection(config);
      const versionResult = await oracleConn.execute('SELECT BANNER as version FROM v$version WHERE ROWNUM = 1');
      const statsResult = await oracleConn.execute(`
        SELECT 
          value as max_connections
        FROM v$parameter 
        WHERE name = 'processes'
      `);

      const version = (versionResult.rows?.[0] as any[])?.[0] || 'unknown';
      const maxConnections = parseInt((statsResult.rows?.[0] as any[])?.[0] || '0', 10);

      return {
        version,
        serverTime: new Date(),
        maxConnections,
        currentConnections: await this.getOracleCurrentConnections(oracleConn)
      };
    } finally {
      if (oracleConn) {
        await oracleConn.close();
      }
    }
  }

  // 获取 Oracle 当前连接数
  private async getOracleCurrentConnections(oracleConn: OracleConnection): Promise<number> {
    const result = await oracleConn.execute(`
      SELECT COUNT(*) as current_connections
      FROM v$session
      WHERE type != 'BACKGROUND'
    `);
    return parseInt((result.rows?.[0] as any[])?.[0] || '0', 10);
  }
} 