declare module 'pg' {
  export interface ClientConfig {
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    ssl?: boolean | {
      rejectUnauthorized?: boolean;
      ca?: string;
      key?: string;
      cert?: string;
    };
  }

  export class Client {
    constructor(config: ClientConfig | string);
    connect(): Promise<void>;
    query(text: string, params?: any[]): Promise<any>;
    end(): Promise<void>;
  }

  export class Pool {
    constructor(config: ClientConfig | string);
    connect(): Promise<PoolClient>;
    query(text: string, params?: any[]): Promise<any>;
    end(): Promise<void>;
  }

  export interface PoolClient extends Client {
    release(): void;
  }
} 