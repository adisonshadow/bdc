declare module 'mysql2/promise' {
  export interface ConnectionOptions {
    host: string;
    user: string;
    password: string;
    database: string;
    port?: number;
    ssl?: {
      rejectUnauthorized?: boolean;
      ca?: string;
      cert?: string;
      key?: string;
    };
  }

  export interface Connection {
    query<T = any>(sql: string, values?: any[]): Promise<[T, any]>;
    execute<T = any>(sql: string, values?: any[]): Promise<[T, any]>;
    end(): Promise<void>;
    release(): void;
  }

  export interface Pool {
    getConnection(): Promise<Connection>;
    query<T = any>(sql: string, values?: any[]): Promise<[T, any]>;
    execute<T = any>(sql: string, values?: any[]): Promise<[T, any]>;
    end(): Promise<void>;
  }

  export function createConnection(options: ConnectionOptions): Promise<Connection>;
  export function createPool(options: ConnectionOptions): Pool;
} 