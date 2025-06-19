declare module 'mysql2/promise' {
  export interface ConnectionOptions {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl?: any;
  }

  export interface Connection {
    query(sql: string, values?: any[]): Promise<any>;
    execute(sql: string, values?: any[]): Promise<any>;
    end(): Promise<void>;
  }

  export default {
    createConnection(options: ConnectionOptions): Promise<Connection>;
  };
}

declare module 'mongodb' {
  export interface MongoClientOptions {
    useNewUrlParser?: boolean;
    useUnifiedTopology?: boolean;
    ssl?: boolean;
    sslValidate?: boolean;
    sslCA?: Buffer;
    sslCert?: Buffer;
    sslKey?: Buffer;
    sslPass?: string;
  }

  export class MongoClient {
    constructor(url: string, options?: MongoClientOptions);
    connect(): Promise<MongoClient>;
    close(): Promise<void>;
    db(name: string): any;
  }
}

declare module 'mssql' {
  export interface config {
    user: string;
    password: string;
    server: string;
    port?: number;
    database: string;
    options?: {
      encrypt?: boolean;
      trustServerCertificate?: boolean;
    };
  }

  export interface ConnectionPool {
    request(): Request;
    close(): Promise<void>;
  }

  export interface Request {
    query(command: string): Promise<any>;
    input(name: string, value: any): Request;
    execute(procedure: string): Promise<any>;
  }

  export default {
    connect(config: config): Promise<ConnectionPool>;
  };
}

declare module 'oracledb' {
  export interface ConnectionAttributes {
    user: string;
    password: string;
    connectString: string;
    privilege?: number;
  }

  export interface Connection {
    execute(sql: string, params?: any[], options?: any): Promise<any>;
    close(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
  }

  export interface PoolAttributes {
    user: string;
    password: string;
    connectString: string;
    poolMin?: number;
    poolMax?: number;
    poolIncrement?: number;
  }

  export interface Pool {
    getConnection(): Promise<Connection>;
    close(): Promise<void>;
  }

  const oracledb: {
    getConnection(connectionAttributes: ConnectionAttributes): Promise<Connection>;
    createPool(poolAttributes: PoolAttributes): Promise<Pool>;
    initOracleClient(): void;
  };

  export default oracledb;
} 