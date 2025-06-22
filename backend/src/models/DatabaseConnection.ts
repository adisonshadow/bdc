import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { encrypt, decrypt } from '../utils/crypto';

// 数据库类型枚举
export enum DatabaseType {
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
  MONGODB = 'mongodb',
  SQLSERVER = 'sqlserver',
  ORACLE = 'oracle'
}

// 连接状态枚举
export enum ConnectionStatus {
  ACTIVE = 'active',           // 活跃
  INACTIVE = 'inactive',       // 未激活
  TESTING = 'testing',         // 测试中
  FAILED = 'failed',           // 连接失败
  MAINTENANCE = 'maintenance'  // 维护中
}

// SSL配置接口
interface SSLConfig {
  enabled: boolean;           // 是否启用SSL
  verifyServerCert: boolean;  // 是否验证服务器证书
  caCert?: string;           // CA证书
  clientCert?: string;       // 客户端证书
  clientKey?: string;        // 客户端私钥
}

// 连接池配置接口
interface PoolConfig {
  min: number;               // 最小连接数
  max: number;               // 最大连接数
  idleTimeoutMillis: number; // 空闲超时时间（毫秒）
  connectionTimeoutMillis: number; // 连接超时时间（毫秒）
}

// 监控配置接口
interface MonitorConfig {
  enabled: boolean;          // 是否启用监控
  checkInterval: number;     // 检查间隔（秒）
  metrics: string[];         // 监控指标列表
  alertThresholds: {         // 告警阈值
    maxConnections: number;  // 最大连接数
    maxQueryTime: number;    // 最大查询时间
    maxErrorRate: number;    // 最大错误率
  };
}

@Entity({ name: 'database_connections', schema: 'bdc' })
export class DatabaseConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ 
    type: 'varchar', 
    length: 100, 
    unique: true,
    nullable: false,
    comment: '连接名称'
  })
  name: string;

  @Column({ 
    type: 'varchar', 
    length: 100,
    nullable: true,
    comment: '连接描述'
  })
  description: string;

  @Column({
    type: 'enum',
    enum: DatabaseType,
    nullable: false,
    comment: '数据库类型'
  })
  type: DatabaseType;

  @Column({ 
    type: 'varchar', 
    length: 255,
    nullable: false,
    comment: '主机地址'
  })
  host: string;

  @Column({ 
    type: 'integer',
    nullable: false,
    comment: '端口号'
  })
  port: number;

  @Column({ 
    type: 'varchar', 
    length: 100,
    nullable: false,
    comment: '数据库名称'
  })
  database: string;

  @Column({ 
    type: 'varchar', 
    length: 100,
    nullable: false,
    comment: '用户名'
  })
  username: string;

  @Column({ 
    type: 'varchar', 
    length: 255,
    nullable: false,
    select: false,  // 查询时默认不返回密码
    comment: '加密后的密码'
  })
  password: string;

  @Column({ 
    type: 'varchar', 
    length: 100,
    nullable: true,
    comment: 'Schema名称'
  })
  schema: string;

  @Column({ 
    type: 'jsonb',
    nullable: true,
    name: 'sslconfig',
    comment: 'SSL配置'
  })
  sslConfig: SSLConfig;

  @Column({ 
    type: 'jsonb',
    nullable: true,
    name: 'poolconfig',
    comment: '连接池配置'
  })
  poolConfig: PoolConfig;

  @Column({ 
    type: 'jsonb',
    nullable: true,
    name: 'monitorconfig',
    comment: '监控配置'
  })
  monitorConfig: MonitorConfig;

  @Column({
    type: 'enum',
    enum: ConnectionStatus,
    default: ConnectionStatus.INACTIVE,
    nullable: false,
    comment: '连接状态'
  })
  status: ConnectionStatus;

  @Column({ 
    type: 'boolean',
    default: false,
    nullable: false,
    name: 'allowremote',
    comment: '是否支持远程连接'
  })
  allowRemote: boolean;

  @Column({ 
    type: 'varchar', 
    length: 255,
    nullable: true,
    name: 'allowedips',
    comment: '允许的IP地址列表，多个用逗号分隔'
  })
  allowedIps: string;

  @Column({ 
    type: 'timestamp with time zone',
    nullable: true,
    name: 'lasttestat',
    comment: '最后测试连接时间'
  })
  lastTestAt: Date;

  @Column({ 
    type: 'boolean',
    default: false,
    nullable: false,
    name: 'lasttestsuccess',
    comment: '最后测试是否成功'
  })
  lastTestSuccess: boolean;

  @Column({ 
    type: 'text',
    nullable: true,
    name: 'lasttesterror',
    comment: '最后测试错误信息'
  })
  lastTestError: string | null;

  @Column({ 
    type: 'jsonb',
    nullable: true,
    comment: '连接统计信息'
  })
  stats: {
    totalConnections: number;    // 总连接数
    activeConnections: number;   // 活跃连接数
    failedConnections: number;   // 失败连接数
    lastErrorAt: Date;          // 最后错误时间
    lastError: string;          // 最后错误信息
    avgQueryTime: number;       // 平均查询时间
    maxQueryTime: number;       // 最大查询时间
  };

  @Column({ 
    type: 'boolean',
    default: true,
    name: 'is_active',
    comment: '是否启用'
  })
  isActive: boolean;

  @CreateDateColumn({ 
    type: 'timestamp with time zone',
    name: 'created_at',
    comment: '创建时间'
  })
  createdAt: Date;

  @UpdateDateColumn({ 
    type: 'timestamp with time zone',
    name: 'updated_at',
    comment: '更新时间'
  })
  updatedAt: Date;

  // 验证方法
  validateName(): boolean {
    return typeof this.name === 'string' && this.name.length > 0;
  }

  validateHost(): boolean {
    return typeof this.host === 'string' && this.host.length > 0;
  }

  validatePort(): boolean {
    return typeof this.port === 'number' && this.port > 0 && this.port <= 65535;
  }

  validateDatabase(): boolean {
    return typeof this.database === 'string' && this.database.length > 0;
  }

  validateUsername(): boolean {
    return typeof this.username === 'string' && this.username.length > 0;
  }

  validateType(): boolean {
    return Object.values(DatabaseType).includes(this.type);
  }

  validateStatus(): boolean {
    return Object.values(ConnectionStatus).includes(this.status);
  }

  // 密码加密
  async encryptPassword(): Promise<void> {
    if (this.password) {
      this.password = await encrypt(this.password);
    }
  }

  // 密码解密
  async decryptPassword(): Promise<string> {
    if (this.password) {
      return await decrypt(this.password);
    }
    return '';
  }

  // 获取连接字符串
  getConnectionString(): string {
    const password = this.password ? '******' : '';
    switch (this.type) {
      case DatabaseType.POSTGRESQL:
        return `postgresql://${this.username}:${password}@${this.host}:${this.port}/${this.database}`;
      case DatabaseType.MYSQL:
        return `mysql://${this.username}:${password}@${this.host}:${this.port}/${this.database}`;
      case DatabaseType.MONGODB:
        return `mongodb://${this.username}:${password}@${this.host}:${this.port}/${this.database}`;
      case DatabaseType.SQLSERVER:
        return `mssql://${this.username}:${password}@${this.host}:${this.port}/${this.database}`;
      case DatabaseType.ORACLE:
        return `oracle://${this.username}:${password}@${this.host}:${this.port}/${this.database}`;
      default:
        return '';
    }
  }

  // 检查IP是否允许访问
  isIpAllowed(ip: string): boolean {
    if (!this.allowedIps) return true;
    const allowedIps = this.allowedIps.split(',').map(ip => ip.trim());
    return allowedIps.includes(ip);
  }
} 