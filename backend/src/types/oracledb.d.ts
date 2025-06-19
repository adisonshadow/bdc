declare module 'oracledb' {
  export interface ConnectionAttributes {
    user: string;
    password: string;
    connectString: string;
    walletLocation?: string;
  }

  export interface Connection {
    execute(sql: string, params?: any[], options?: any): Promise<{
      rows: any[][];
      outBinds?: any;
      rowsAffected?: number;
    }>;
    close(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
  }

  export function getConnection(connectionAttributes: ConnectionAttributes): Promise<Connection>;
  export function createPool(poolAttributes: ConnectionAttributes & {
    poolMin?: number;
    poolMax?: number;
    poolIncrement?: number;
  }): Promise<Pool>;

  export interface Pool {
    getConnection(): Promise<Connection>;
    close(): Promise<void>;
  }
} 