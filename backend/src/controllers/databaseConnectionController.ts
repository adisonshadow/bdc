import { Request, Response } from 'express';
import { getDataSource } from '../data-source';
import { DatabaseConnection, ConnectionStatus, DatabaseType } from '../models/DatabaseConnection';
import { validatePasswordStrength } from '../utils/crypto';
import { Client } from 'pg';
import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';
// import * as sql from 'mssql';
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

      // 验证必填字段（密码现在是可选的）
      if (!name || !type || !host || !port || !database || !username) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段'
        });
      }

      // 收集警告信息
      const warnings: string[] = [];

      // 检查密码强度（如果提供了密码）
      if (password) {
        const passwordStrength = validatePasswordStrength(password);
        if (passwordStrength < 60) {
          warnings.push('密码强度不足，请使用更复杂的密码');
        }
      } else {
        warnings.push('未设置密码，请确保数据库允许无密码连接');
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
        password: password || '', // 如果密码为空，使用空字符串
        schema,
        sslConfig,
        poolConfig,
        monitorConfig,
        allowRemote,
        allowedIps,
        status: ConnectionStatus.INACTIVE
      });

      // 加密密码（即使是空密码也要加密）
      await connection.encryptPassword();

      // 保存连接
      const savedConnection = await repository.save(connection);

      // 返回结果（不包含密码）
      const { password: _, ...result } = savedConnection;
      return res.status(201).json({
        success: true,
        data: result,
        warnings: warnings.length > 0 ? warnings : undefined
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
            // TODO: 修复SQL Server类型问题
            return res.status(400).json({
              success: false,
              message: 'SQL Server表结构获取功能暂时不可用'
            });
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
        rejectUnauthorized: connection.sslConfig.verifyServerCert !== false,
        ca: connection.sslConfig.caCert,
        cert: connection.sslConfig.clientCert,
        key: connection.sslConfig.clientKey,
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
  /*
  private async testSQLServerConnection(connection: DatabaseConnection, password: string) {
    const sqlConfig = {
      server: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.username,
      password: password,
      options: {
        encrypt: connection.sslConfig?.enabled || false,
        trustServerCertificate: !connection.sslConfig?.verifyServerCert
      }
    };

    const pool = await sql.connect(sqlConfig);

    try {
      // 获取服务器信息
      const serverInfoResult = await pool.request().query(`
        SELECT 
          SERVERPROPERTY('ProductVersion') as version,
          GETDATE() as server_time,
          @@MAX_CONNECTIONS as max_connections,
          (SELECT COUNT(*) FROM sys.dm_exec_sessions WHERE status = 'running') as current_connections
      `);

      const serverInfo = serverInfoResult.recordset[0];

      return {
        version: serverInfo.version,
        serverTime: serverInfo.server_time,
        maxConnections: serverInfo.max_connections,
        currentConnections: serverInfo.current_connections
      };
    } finally {
      await pool.close();
    }
  }
  */

  // 测试 Oracle 连接
  private async testOracleConnection(dbConnection: DatabaseConnection, password: string) {
    const config = {
      user: dbConnection.username,
      password: password,
      connectString: `${dbConnection.host}:${dbConnection.port}/${dbConnection.database}`
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
    try {
      const result = await oracleConn.execute(
        "SELECT COUNT(*) as count FROM v$session WHERE status = 'ACTIVE'"
      );
      return (result.rows?.[0] as any)?.[0] as number || 0;
    } catch (error) {
      console.error('获取Oracle当前连接数失败:', error);
      return 0;
    }
  }

  // 获取数据库表结构
  async getTables(req: Request, res: Response) {
    try {
      const repository = getDataSource().getRepository(DatabaseConnection);
      const { id } = req.params;
      
      // 查找连接
      const connection = await repository.findOne({ where: { id } });
      if (!connection) {
        return res.status(404).json({
          success: false,
          message: '数据库连接不存在'
        });
      }

      // 检查连接是否测试成功
      if (!connection.lastTestSuccess) {
        return res.status(400).json({
          success: false,
          message: '请先测试数据库连接'
        });
      }

      let tables: any[] = [];

      try {
        // 根据数据库类型获取表结构
        switch (connection.type) {
          case DatabaseType.POSTGRESQL:
            tables = await this.getPostgreSQLTables(connection);
            break;
          case DatabaseType.MYSQL:
            tables = await this.getMySQLTables(connection);
            break;
          case DatabaseType.SQLSERVER:
            // TODO: 修复SQL Server类型问题
            return res.status(400).json({
              success: false,
              message: 'SQL Server表结构获取功能暂时不可用'
            });
            break;
          case DatabaseType.ORACLE:
            tables = await this.getOracleTables(connection);
            break;
          case DatabaseType.MONGODB:
            tables = await this.getMongoDBTables(connection);
            break;
          default:
            return res.status(400).json({
              success: false,
              message: '不支持的数据库类型'
            });
        }

        return res.json({
          success: true,
          data: tables
        });
      } catch (error) {
        console.error('获取表结构失败:', error);
        return res.status(500).json({
          success: false,
          message: `获取表结构失败: ${error instanceof Error ? error.message : '未知错误'}`
        });
      }
    } catch (error) {
      console.error('获取数据库表结构失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取数据库表结构失败'
      });
    }
  }

  // 获取PostgreSQL表结构
  private async getPostgreSQLTables(connection: DatabaseConnection): Promise<any[]> {
    const client = new Client({
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.username,
      password: await connection.decryptPassword(),
      ssl: connection.sslConfig?.enabled ? {
        rejectUnauthorized: connection.sslConfig.verifyServerCert !== false,
        ca: connection.sslConfig.caCert,
        cert: connection.sslConfig.clientCert,
        key: connection.sslConfig.clientKey,
      } : false
    });

    await client.connect();

    try {
      // 获取表列表
      const tablesQuery = `
        SELECT 
          t.table_name,
          t.table_schema,
          obj_description(c.oid) as description,
          pg_total_relation_size(c.oid) as size,
          c.reltuples as row_count,
          c.relname as created_at,
          c.relname as updated_at
        FROM information_schema.tables t
        JOIN pg_class c ON c.relname = t.table_name
        JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
        WHERE t.table_schema = $1 AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
      `;
      
      const tablesResult = await client.query(tablesQuery, [connection.schema || 'public']);
      
      const tables = [];
      
      for (const tableRow of tablesResult.rows) {
        // 获取字段信息
        const columnsQuery = `
          SELECT 
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default,
            c.character_maximum_length,
            c.numeric_precision,
            c.numeric_scale,
            c.ordinal_position,
            c.character_set_name,
            c.collation_name,
            pgd.description as column_description,
            CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
            CASE WHEN c.column_default LIKE 'nextval%' THEN true ELSE false END as is_auto_increment
          FROM information_schema.columns c
          LEFT JOIN pg_catalog.pg_statio_all_tables st ON st.schemaname = c.table_schema AND st.relname = c.table_name
          LEFT JOIN pg_catalog.pg_description pgd ON pgd.objoid = st.relid AND pgd.objsubid = c.ordinal_position
          LEFT JOIN (
            SELECT ku.table_schema, ku.table_name, ku.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY'
          ) pk ON pk.table_schema = c.table_schema AND pk.table_name = c.table_name AND pk.column_name = c.column_name
          WHERE c.table_schema = $1 AND c.table_name = $2
          ORDER BY c.ordinal_position
        `;
        
        const columnsResult = await client.query(columnsQuery, [tableRow.table_schema, tableRow.table_name]);
        
        // 获取索引信息
        const indexesQuery = `
          SELECT 
            i.relname as index_name,
            CASE 
              WHEN ix.indisunique THEN 'UNIQUE'
              WHEN ix.indisprimary THEN 'PRIMARY'
              ELSE 'INDEX'
            END as index_type,
            array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) as columns
          FROM pg_index ix
          JOIN pg_class i ON i.oid = ix.indexrelid
          JOIN pg_class t ON t.oid = ix.indrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
          WHERE n.nspname = $1 AND t.relname = $2
          GROUP BY i.relname, ix.indisunique, ix.indisprimary
        `;
        
        const indexesResult = await client.query(indexesQuery, [tableRow.table_schema, tableRow.table_name]);
        
        // 获取外键信息
        const foreignKeysQuery = `
          SELECT 
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name as referenced_table_name,
            ccu.table_schema as referenced_table_schema,
            ccu.column_name as referenced_column_name,
            rc.update_rule,
            rc.delete_rule
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
          JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = $1 AND tc.table_name = $2
        `;
        
        const foreignKeysResult = await client.query(foreignKeysQuery, [tableRow.table_schema, tableRow.table_name]);
        
        tables.push({
          tableName: tableRow.table_name,
          schema: tableRow.table_schema,
          description: tableRow.description,
          tableType: 'BASE TABLE',
          rowCount: Math.floor(tableRow.row_count || 0),
          size: tableRow.size || 0,
          createdAt: tableRow.created_at,
          updatedAt: tableRow.updated_at,
          columns: columnsResult.rows.map((col: any) => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            primaryKey: col.is_primary_key,
            defaultValue: col.column_default,
            description: col.column_description,
            length: col.character_maximum_length,
            precision: col.numeric_precision,
            scale: col.numeric_scale,
            autoIncrement: col.is_auto_increment,
            ordinalPosition: col.ordinal_position,
            characterSet: col.character_set_name,
            collation: col.collation_name,
            updatedAt: null // PostgreSQL不提供字段级别的更新时间
          })),
          indexes: indexesResult.rows.map((idx: any) => ({
            name: idx.index_name,
            type: idx.index_type,
            columns: idx.columns,
            description: null
          })),
          foreignKeys: foreignKeysResult.rows.map((fk: any) => ({
            name: fk.constraint_name,
            columnName: fk.column_name,
            referencedTableName: fk.referenced_table_name,
            referencedTableSchema: fk.referenced_table_schema,
            referencedColumnName: fk.referenced_column_name,
            updateRule: fk.update_rule,
            deleteRule: fk.delete_rule
          }))
        });
      }
      
      return tables;
    } finally {
      await client.end();
    }
  }

  // 获取MySQL表结构
  private async getMySQLTables(connection: DatabaseConnection): Promise<any[]> {
    const mysqlConnection = await mysql.createConnection({
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.username,
      password: await connection.decryptPassword(),
      ssl: connection.sslConfig?.enabled ? {
        rejectUnauthorized: connection.sslConfig.verifyServerCert !== false,
        ca: connection.sslConfig.caCert,
        cert: connection.sslConfig.clientCert,
        key: connection.sslConfig.clientKey,
      } : undefined
    });

    try {
      // 获取表列表
      const [tablesResult] = await mysqlConnection.execute(`
        SELECT 
          TABLE_NAME as table_name,
          TABLE_SCHEMA as table_schema,
          TABLE_COMMENT as description,
          TABLE_ROWS as row_count,
          DATA_LENGTH + INDEX_LENGTH as size,
          CREATE_TIME as created_at,
          UPDATE_TIME as updated_at
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `, [connection.database]);

      const tables = [];

      for (const tableRow of tablesResult as any[]) {
        // 获取字段信息
        const [columnsResult] = await mysqlConnection.execute(`
          SELECT 
            COLUMN_NAME as column_name,
            DATA_TYPE as data_type,
            IS_NULLABLE as is_nullable,
            COLUMN_DEFAULT as column_default,
            CHARACTER_MAXIMUM_LENGTH as character_maximum_length,
            NUMERIC_PRECISION as numeric_precision,
            NUMERIC_SCALE as numeric_scale,
            ORDINAL_POSITION as ordinal_position,
            CHARACTER_SET_NAME as character_set_name,
            COLLATION_NAME as collation_name,
            COLUMN_COMMENT as column_description,
            COLUMN_KEY as column_key,
            EXTRA as extra
          FROM information_schema.COLUMNS 
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `, [connection.database, tableRow.table_name]);

        // 获取索引信息
        const [indexesResult] = await mysqlConnection.execute(`
          SELECT 
            INDEX_NAME as index_name,
            NON_UNIQUE as non_unique,
            GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as columns
          FROM information_schema.STATISTICS 
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
          GROUP BY INDEX_NAME, NON_UNIQUE
        `, [connection.database, tableRow.table_name]);

        // 获取外键信息
        const [foreignKeysResult] = await mysqlConnection.execute(`
          SELECT 
            CONSTRAINT_NAME as constraint_name,
            COLUMN_NAME as column_name,
            REFERENCED_TABLE_NAME as referenced_table_name,
            REFERENCED_TABLE_SCHEMA as referenced_table_schema,
            REFERENCED_COLUMN_NAME as referenced_column_name,
            UPDATE_RULE as update_rule,
            DELETE_RULE as delete_rule
          FROM information_schema.KEY_COLUMN_USAGE 
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
        `, [connection.database, tableRow.table_name]);

        tables.push({
          tableName: tableRow.table_name,
          schema: tableRow.table_schema,
          description: tableRow.description,
          tableType: 'BASE TABLE',
          rowCount: tableRow.row_count || 0,
          size: tableRow.size || 0,
          createdAt: tableRow.created_at,
          updatedAt: tableRow.updated_at,
          columns: (columnsResult as any[]).map(col => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            primaryKey: col.column_key === 'PRI',
            defaultValue: col.column_default,
            description: col.column_description,
            length: col.character_maximum_length,
            precision: col.numeric_precision,
            scale: col.numeric_scale,
            autoIncrement: col.extra.includes('auto_increment'),
            ordinalPosition: col.ordinal_position,
            characterSet: col.character_set_name,
            collation: col.collation_name,
            updatedAt: null
          })),
          indexes: (indexesResult as any[]).map(idx => ({
            name: idx.index_name,
            type: idx.index_name === 'PRIMARY' ? 'PRIMARY' : (idx.non_unique === 0 ? 'UNIQUE' : 'INDEX'),
            columns: idx.columns.split(','),
            description: null
          })),
          foreignKeys: (foreignKeysResult as any[]).map(fk => ({
            name: fk.constraint_name,
            columnName: fk.column_name,
            referencedTableName: fk.referenced_table_name,
            referencedTableSchema: fk.referenced_table_schema,
            referencedColumnName: fk.referenced_column_name,
            updateRule: fk.update_rule,
            deleteRule: fk.delete_rule
          }))
        });
      }

      return tables;
    } finally {
      await mysqlConnection.end();
    }
  }

  // 获取Oracle表结构
  private async getOracleTables(connection: DatabaseConnection): Promise<any[]> {
    const oracleConnection = await oracledb.getConnection({
      user: connection.username,
      password: await connection.decryptPassword(),
      connectString: `${connection.host}:${connection.port}/${connection.database}`
    });

    try {
      // 获取表列表
      const tablesResult = await oracleConnection.execute(`
        SELECT 
          t.table_name,
          t.owner as table_schema,
          c.comments as description,
          t.num_rows as row_count,
          s.bytes as size,
          t.created as created_at,
          t.last_ddl_time as updated_at
        FROM all_tables t
        LEFT JOIN all_tab_comments c ON t.table_name = c.table_name AND t.owner = c.owner
        LEFT JOIN all_segments s ON t.table_name = s.segment_name AND t.owner = s.owner
        WHERE t.owner = :1 AND t.table_type = 'TABLE'
        ORDER BY t.table_name
      `, [connection.schema?.toUpperCase() || connection.username.toUpperCase()]);

      const tables = [];

      for (const tableRow of tablesResult.rows as any[]) {
        // 获取字段信息
        const columnsResult = await oracleConnection.execute(`
          SELECT 
            c.column_name,
            c.data_type,
            c.nullable,
            c.data_default as column_default,
            c.data_length,
            c.data_precision,
            c.data_scale,
            c.column_id as ordinal_position,
            cc.comments as column_description,
            CASE WHEN pk.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END as is_primary_key,
            CASE WHEN c.identity_column = 'YES' THEN 'YES' ELSE 'NO' END as is_auto_increment
          FROM all_tab_columns c
          LEFT JOIN all_col_comments cc ON c.table_name = cc.table_name AND c.owner = cc.owner AND c.column_name = cc.column_name
          LEFT JOIN (
            SELECT cols.column_name
            FROM all_constraints cons
            JOIN all_cons_columns cols ON cons.constraint_name = cols.constraint_name
            WHERE cons.constraint_type = 'P' AND cons.table_name = :1 AND cons.owner = :2
          ) pk ON pk.column_name = c.column_name
          WHERE c.table_name = :1 AND c.owner = :2
          ORDER BY c.column_id
        `, [tableRow[0], tableRow[1]]);

        // 获取索引信息
        const indexesResult = await oracleConnection.execute(`
          SELECT 
            i.index_name,
            CASE 
              WHEN i.uniqueness = 'UNIQUE' THEN 'UNIQUE'
              WHEN i.index_type = 'NORMAL' THEN 'INDEX'
              ELSE 'INDEX'
            END as index_type,
            LISTAGG(c.column_name, ',') WITHIN GROUP (ORDER BY c.column_position) as columns
          FROM all_indexes i
          JOIN all_ind_columns c ON i.index_name = c.index_name AND i.owner = c.index_owner
          WHERE i.table_name = :1 AND i.owner = :2
          GROUP BY i.index_name, i.uniqueness, i.index_type
        `, [tableRow[0], tableRow[1]]);

        // 获取外键信息
        const foreignKeysResult = await oracleConnection.execute(`
          SELECT 
            fk.constraint_name,
            fk.column_name,
            fk.r_table_name as referenced_table_name,
            fk.r_owner as referenced_table_schema,
            fk.r_column_name as referenced_column_name,
            fk.update_rule,
            fk.delete_rule
          FROM all_cons_columns fk
          JOIN all_constraints c ON fk.constraint_name = c.constraint_name AND fk.owner = c.owner
          WHERE c.constraint_type = 'R' AND c.table_name = :1 AND c.owner = :2
        `, [tableRow[0], tableRow[1]]);

        tables.push({
          tableName: tableRow[0],
          schema: tableRow[1],
          description: tableRow[2],
          tableType: 'TABLE',
          rowCount: tableRow[3] || 0,
          size: tableRow[4] || 0,
          createdAt: tableRow[5],
          updatedAt: tableRow[6],
          columns: (columnsResult.rows as any[]).map(col => ({
            name: col[0],
            type: col[1],
            nullable: col[2] === 'Y',
            primaryKey: col[9] === 'YES',
            defaultValue: col[3],
            description: col[8],
            length: col[4],
            precision: col[5],
            scale: col[6],
            autoIncrement: col[10] === 'YES',
            ordinalPosition: col[7],
            characterSet: null,
            collation: null,
            updatedAt: null
          })),
          indexes: (indexesResult.rows as any[]).map(idx => ({
            name: idx[0],
            type: idx[1],
            columns: idx[2].split(','),
            description: null
          })),
          foreignKeys: (foreignKeysResult.rows as any[]).map(fk => ({
            name: fk[0],
            columnName: fk[1],
            referencedTableName: fk[2],
            referencedTableSchema: fk[3],
            referencedColumnName: fk[4],
            updateRule: fk[5],
            deleteRule: fk[6]
          }))
        });
      }

      return tables;
    } finally {
      await oracleConnection.close();
    }
  }

  // 获取MongoDB表结构（集合信息）
  private async getMongoDBTables(connection: DatabaseConnection): Promise<any[]> {
    const client = new MongoClient(`mongodb://${connection.username}:${await connection.decryptPassword()}@${connection.host}:${connection.port}/${connection.database}`);

    try {
      await client.connect();
      const db = client.db(connection.database);
      
      // 获取集合列表
      const collections = await db.listCollections().toArray();
      
      const tables = [];

      for (const collection of collections) {
        // 获取集合统计信息
        const stats = await (db.collection(collection.name) as any).stats();
        
        // 获取示例文档来分析字段结构
        const sampleDoc = await db.collection(collection.name).findOne({});
        
        // 分析字段结构
        const columns = this.analyzeMongoDBFields(sampleDoc || {});
        
        tables.push({
          tableName: collection.name,
          schema: connection.database,
          description: (collection as any).options?.validator ? '有验证规则' : null,
          tableType: 'COLLECTION',
          rowCount: stats.count || 0,
          size: stats.size || 0,
          createdAt: null,
          updatedAt: null,
          columns: columns,
          indexes: [],
          foreignKeys: []
        });
      }

      return tables;
    } finally {
      await client.close();
    }
  }

  // 分析MongoDB文档字段
  private analyzeMongoDBFields(doc: any, prefix: string = ''): any[] {
    const columns = [];
    
    for (const [key, value] of Object.entries(doc)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value === null) {
        columns.push({
          name: fullKey,
          type: 'null',
          nullable: true,
          primaryKey: false,
          defaultValue: null,
          description: null,
          length: null,
          precision: null,
          scale: null,
          autoIncrement: false,
          ordinalPosition: columns.length + 1,
          characterSet: null,
          collation: null,
          updatedAt: null
        });
      } else if (typeof value === 'string') {
        columns.push({
          name: fullKey,
          type: 'string',
          nullable: true,
          primaryKey: false,
          defaultValue: null,
          description: null,
          length: value.length,
          precision: null,
          scale: null,
          autoIncrement: false,
          ordinalPosition: columns.length + 1,
          characterSet: null,
          collation: null,
          updatedAt: null
        });
      } else if (typeof value === 'number') {
        columns.push({
          name: fullKey,
          type: Number.isInteger(value) ? 'integer' : 'double',
          nullable: true,
          primaryKey: false,
          defaultValue: null,
          description: null,
          length: null,
          precision: null,
          scale: null,
          autoIncrement: false,
          ordinalPosition: columns.length + 1,
          characterSet: null,
          collation: null,
          updatedAt: null
        });
      } else if (typeof value === 'boolean') {
        columns.push({
          name: fullKey,
          type: 'boolean',
          nullable: true,
          primaryKey: false,
          defaultValue: null,
          description: null,
          length: null,
          precision: null,
          scale: null,
          autoIncrement: false,
          ordinalPosition: columns.length + 1,
          characterSet: null,
          collation: null,
          updatedAt: null
        });
      } else if (value instanceof Date) {
        columns.push({
          name: fullKey,
          type: 'date',
          nullable: true,
          primaryKey: false,
          defaultValue: null,
          description: null,
          length: null,
          precision: null,
          scale: null,
          autoIncrement: false,
          ordinalPosition: columns.length + 1,
          characterSet: null,
          collation: null,
          updatedAt: null
        });
      } else if (Array.isArray(value)) {
        columns.push({
          name: fullKey,
          type: 'array',
          nullable: true,
          primaryKey: false,
          defaultValue: null,
          description: `数组，长度: ${value.length}`,
          length: value.length,
          precision: null,
          scale: null,
          autoIncrement: false,
          ordinalPosition: columns.length + 1,
          characterSet: null,
          collation: null,
          updatedAt: null
        });
      } else if (typeof value === 'object') {
        // 递归分析嵌套对象
        columns.push(...this.analyzeMongoDBFields(value, fullKey));
      }
    }
    
    return columns;
  }
} 