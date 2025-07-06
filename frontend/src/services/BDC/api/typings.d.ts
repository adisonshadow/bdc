declare namespace API {
  type ApiField =
    // #/components/schemas/BaseField
    BaseField & {
      /** API数据源类型 */
      type?: "api";
      apiConfig?: {
        endpoint: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        multiple: boolean;
        params?: Record<string, any>;
        headers?: Record<string, any>;
        resultMapping: { path: string; fields: Record<string, any> };
        cache?: { ttl?: number; key?: string };
      };
    };

  type AutoIncrementField =
    // #/components/schemas/BaseField
    BaseField & {
      /** 自增长ID字段类型 */
      type?: "auto_increment";
    };

  type BaseField = {
    /** 字段唯一标识 */
    id: string;
    /** 字段名称 */
    name: string;
    /** 字段类型 */
    type:
      | "uuid"
      | "auto_increment"
      | "string"
      | "text"
      | "number"
      | "boolean"
      | "date"
      | "enum"
      | "relation"
      | "media"
      | "api";
    /** 字段描述 */
    description?: string;
    /** 是否必填 */
    required: boolean;
  };

  type BooleanField =
    // #/components/schemas/BaseField
    BaseField & {
      /** 布尔类型 */
      type?: "boolean";
    };

  type DatabaseColumn = {
    /** 字段名 */
    name: string;
    /** 数据类型 */
    type: string;
    /** 是否为空 */
    nullable: boolean;
    /** 是否为主键 */
    primaryKey: boolean;
    /** 默认值 */
    defaultValue?: string;
    /** 字段描述 */
    description?: string;
    /** 字段长度 */
    length?: number;
    /** 精度（用于decimal类型） */
    precision?: number;
    /** 小数位数（用于decimal类型） */
    scale?: number;
    /** 是否自增 */
    autoIncrement?: boolean;
    /** 字段位置 */
    ordinalPosition?: number;
    /** 字符集 */
    characterSet?: string;
    /** 排序规则 */
    collation?: string;
    /** 最后修改时间 */
    updatedAt?: string;
  };

  type DatabaseConnection = {
    /** 数据库连接ID */
    id?: string;
    /** 连接名称 */
    name: string;
    /** 连接描述 */
    description?: string;
    /** 数据库类型 */
    type: "postgresql" | "mysql" | "mongodb" | "sqlserver" | "oracle";
    /** 主机地址 */
    host: string;
    /** 端口号 */
    port: number;
    /** 数据库名称 */
    database: string;
    /** 用户名 */
    username: string;
    /** 密码（加密存储） */
    password: string;
    /** Schema名称 */
    schema?: string;
    /** SSL配置 */
    sslConfig?: {
      enabled?: boolean;
      verifyServerCert?: boolean;
      caCert?: string;
      clientCert?: string;
      clientKey?: string;
    };
    /** 连接池配置 */
    poolConfig?: {
      min?: number;
      max?: number;
      idleTimeoutMillis?: number;
      connectionTimeoutMillis?: number;
    };
    /** 监控配置 */
    monitorConfig?: {
      enabled?: boolean;
      checkInterval?: number;
      metrics?: string[];
      alertThresholds?: {
        maxConnections?: number;
        maxQueryTime?: number;
        maxErrorRate?: number;
      };
    };
    /** 连接状态 */
    status?: "active" | "inactive" | "testing" | "failed" | "maintenance";
    /** 是否支持远程连接 */
    allowRemote?: boolean;
    /** 允许的IP地址列表，多个用逗号分隔 */
    allowedIps?: string;
    /** 最后测试连接时间 */
    lastTestAt?: string;
    /** 最后测试是否成功 */
    lastTestSuccess?: boolean;
    /** 最后测试错误信息 */
    lastTestError?: string;
    /** 连接统计信息 */
    stats?: {
      totalConnections?: number;
      activeConnections?: number;
      failedConnections?: number;
      lastErrorAt?: string;
      lastError?: string;
      avgQueryTime?: number;
      maxQueryTime?: number;
    };
    /** 是否启用 */
    isActive?: boolean;
    /** 创建时间 */
    createdAt?: string;
    /** 更新时间 */
    updatedAt?: string;
  };

  type DatabaseConnectionCreate = {
    /** 连接名称 */
    name: string;
    /** 连接描述 */
    description?: string;
    /** 数据库类型 */
    type: "postgresql" | "mysql" | "mongodb" | "sqlserver" | "oracle";
    /** 主机地址 */
    host: string;
    /** 端口号 */
    port: number;
    /** 数据库名称 */
    database: string;
    /** 用户名 */
    username: string;
    /** 密码 */
    password: string;
    /** Schema名称 */
    schema?: string;
    sslConfig?: sslConfig;
    poolConfig?: poolConfig;
    monitorConfig?: monitorConfig;
    /** 是否支持远程连接 */
    allowRemote?: boolean;
    /** 允许的IP地址列表，多个用逗号分隔 */
    allowedIps?: string;
  };

  type DatabaseConnectionTest = {
    /** 数据库连接ID */
    id: string;
  };

  type DatabaseConnectionTestResult = {
    /** 测试是否成功 */
    success?: boolean;
    /** 测试结果消息 */
    message?: string;
    /** 连接信息 */
    connectionInfo?: {
      version?: string;
      serverTime?: string;
      maxConnections?: number;
      currentConnections?: number;
    };
  };

  type DatabaseConnectionUpdate = {
    /** 连接名称 */
    name?: string;
    /** 连接描述 */
    description?: string;
    /** 主机地址 */
    host?: string;
    /** 端口号 */
    port?: number;
    /** 数据库名称 */
    database?: string;
    /** 用户名 */
    username?: string;
    /** 密码 */
    password?: string;
    /** Schema名称 */
    schema?: string;
    sslConfig?: sslConfig;
    poolConfig?: poolConfig;
    monitorConfig?: monitorConfig;
    /** 是否支持远程连接 */
    allowRemote?: boolean;
    /** 允许的IP地址列表，多个用逗号分隔 */
    allowedIps?: string;
    /** 是否启用 */
    isActive?: boolean;
  };

  type DatabaseForeignKey = {
    /** 外键名 */
    name: string;
    /** 当前表字段 */
    columnName: string;
    /** 引用表名 */
    referencedTableName: string;
    /** 引用表Schema */
    referencedTableSchema?: string;
    /** 引用字段名 */
    referencedColumnName: string;
    /** 更新规则 */
    updateRule?: string;
    /** 删除规则 */
    deleteRule?: string;
  };

  type DatabaseIndex = {
    /** 索引名 */
    name: string;
    /** 索引类型 */
    type: "primary" | "unique" | "normal" | "fulltext" | "spatial";
    /** 索引字段列表 */
    columns: string[];
    /** 索引描述 */
    description?: string;
  };

  type DatabaseTable = {
    /** 表名 */
    tableName: string;
    /** Schema名称 */
    schema: string;
    /** 表描述 */
    description?: string;
    /** 表类型 */
    tableType?: string;
    /** 行数 */
    rowCount?: number;
    /** 表大小（字节） */
    size?: number;
    /** 创建时间 */
    createdAt?: string;
    /** 最后修改时间 */
    updatedAt?: string;
    /** 字段列表 */
    columns: DatabaseColumn[];
    /** 索引列表 */
    indexes?: DatabaseIndex[];
    /** 外键列表 */
    foreignKeys?: DatabaseForeignKey[];
  };

  type DataStructure = {
    /** 数据结构ID */
    id?: string;
    /** 数据结构名称 */
    name: string;
    /** 数据结构代码 */
    code: string;
    /** 字段定义列表 */
    fields: (
      | UuidField
      | AutoIncrementField
      | StringField
      | TextField
      | NumberField
      | BooleanField
      | DateField
      | EnumField
      | RelationField
      | MediaField
      | ApiField
    )[];
    /** 主键和索引信息 */
    keyIndexes?: {
      primaryKey?: string[];
      indexes?: {
        name?: string;
        fields?: string[];
        type?: "unique" | "normal" | "fulltext" | "spatial";
      }[];
    };
    /** 物理存储信息 */
    physicalStorage?: {
      database?: string;
      table?: string;
      lastMaterializedAt?: string;
      materializedVersion?: number;
    };
    /** 验证错误信息 */
    validationErrors?: {
      code?: string;
      message?: string;
      timestamp?: string;
      details?: Record<string, any>;
    }[];
    /** 数据结构描述 */
    description?: string;
    /** 是否启用 */
    isActive?: boolean;
    /** 版本号 */
    version?: number;
    /** 创建时间 */
    createdAt?: string;
    /** 更新时间 */
    updatedAt?: string;
  };

  type DateField =
    // #/components/schemas/BaseField
    BaseField & {
      /** 日期类型 */
      type?: "date";
      dateConfig?: { dateType: "year" | "year-month" | "date" | "datetime" };
    };

  type deleteDatabaseConnectionsIdParams = {
    /** 数据库连接ID */
    id: string;
  };

  type deleteEnumsIdParams = {
    /** 枚举ID */
    id: string;
  };

  type deleteSchemasIdParams = {
    /** 数据结构定义ID */
    id: string;
  };

  type Enum = {
    /** 枚举ID */
    id?: string;
    /** 枚举代码（使用:分隔的多级结构，如 system:user:status） */
    code: string;
    /** 枚举名称 (必须以字母开头，只能包含小写字母、数字和下划线) */
    name: string;
    /** 枚举描述 */
    description?: string;
    options: {
      value: string;
      label: string;
      description?: string;
      order?: number;
    }[];
    /** 是否启用 */
    isActive?: boolean;
    /** 创建时间 */
    createdAt?: string;
    /** 更新时间 */
    updatedAt?: string;
  };

  type EnumField =
    // #/components/schemas/BaseField
    BaseField & {
      /** 枚举类型 */
      type?: "enum";
      enumConfig?: {
        targetEnumCode: string;
        multiple: boolean;
        defaultValues?: string[];
      };
    };

  type EnumOption = {
    /** 选项键 */
    key: string;
    /** 选项值 */
    value: string;
    /** 选项描述 */
    description?: string;
    /** 排序号 */
    sortOrder?: number;
    /** 是否启用 */
    isActive?: boolean;
  };

  type getDatabaseConnectionsIdParams = {
    /** 数据库连接ID */
    id: string;
  };

  type getDatabaseConnectionsIdTablesParams = {
    /** 数据库连接ID */
    id: string;
  };

  type getDatabaseConnectionsParams = {
    /** 页码 */
    page?: number;
    /** 每页数量 */
    limit?: number;
    /** 数据库类型 */
    type?: "POSTGRESQL" | "MYSQL" | "MONGODB" | "SQLSERVER" | "ORACLE";
    /** 连接状态 */
    status?: "INACTIVE" | "ACTIVE" | "TESTING" | "FAILED";
    /** 是否激活 */
    isActive?: boolean;
  };

  type getEnumsCodeCodeParams = {
    /** 枚举代码 */
    code: string;
  };

  type getEnumsIdParams = {
    /** 枚举ID */
    id: string;
  };

  type getEnumsParams = {
    /** 是否只返回启用的枚举 */
    isActive?: boolean;
    /** 按枚举代码模糊搜索 */
    code?: string;
    /** 按枚举名称模糊搜索 */
    name?: string;
  };

  type getMaterializeTablesHistoryParams = {
    /** 数据库连接ID（可选） */
    connectionId?: string;
    /** 页码 */
    page?: number;
    /** 每页数量 */
    limit?: number;
  };

  type getSchemasIdParams = {
    /** 数据结构定义ID */
    id: string;
  };

  type getSchemasParams = {
    /** 按数据结构代码模糊搜索 */
    code?: string;
    /** 按数据结构名称模糊搜索 */
    name?: string;
  };

  type keyIndexes = {
    /** 主键字段名列表（支持联合主键） */
    primaryKey?: string[];
    indexes?: {
      name?: string;
      fields?: string[];
      type?: "unique" | "normal" | "fulltext" | "spatial";
    }[];
  };

  type MediaField =
    // #/components/schemas/BaseField
    BaseField & {
      /** 媒体类型 */
      type?: "media";
      mediaConfig?: {
        mediaType: "image" | "video" | "audio" | "document" | "file";
        formats: string[];
        maxSize: number;
        multiple: boolean;
      };
    };

  type NumberField =
    // #/components/schemas/BaseField
    BaseField & {
      /** 数字类型 */
      type?: "number";
      numberConfig?: {
        numberType: "integer" | "float" | "decimal";
        precision?: number;
        scale?: number;
      };
    };

  type postDatabaseConnectionsIdTestParams = {
    /** 数据库连接ID */
    id: string;
  };

  type postSchemasIdValidateParams = {
    /** 数据结构定义ID */
    id: string;
  };

  type putDatabaseConnectionsIdParams = {
    /** 数据库连接ID */
    id: string;
  };

  type putEnumsIdParams = {
    /** 枚举ID */
    id: string;
  };

  type putSchemasIdParams = {
    /** 数据结构定义ID */
    id: string;
  };

  type RelationField =
    // #/components/schemas/BaseField
    BaseField & {
      /** 关联类型 */
      type?: "relation";
      relationConfig?: {
        targetSchemaCode: string;
        targetField?: string;
        multiple: boolean;
        cascadeDelete: "restrict" | "cascade" | "setNull";
        displayFields: string[];
        filterCondition?: Record<string, any>;
      };
    };

  type StringField =
    // #/components/schemas/BaseField
    BaseField & {
      /** 字符串类型（varchar） */
      type?: "string";
      /** 字段长度（适用于字符串类型） */
      length?: number;
    };

  type TextField =
    // #/components/schemas/BaseField
    BaseField & {
      /** 文本类型（text） */
      type?: "text";
    };

  type UuidField =
    // #/components/schemas/BaseField
    BaseField & {
      /** UUID类型 */
      type?: "uuid";
    };
}
