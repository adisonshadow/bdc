import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DatabaseConnection } from './DatabaseConnection';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface QueryParam {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: any;
}

export interface RequestBodyField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: any;
}

export interface ResponseSchema {
  type: string;
  properties: Record<string, any>;
  required?: string[];
}

export interface SqlParam {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: any;
}

@Entity({ name: 'api_definitions', schema: 'bdc' })
export class ApiDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 10 })
  method: HttpMethod;

  @Column({ length: 255 })
  path: string;

  @Column({ type: 'jsonb', nullable: true })
  queryParams: QueryParam[];

  @Column({ type: 'jsonb', nullable: true })
  requestBody: RequestBodyField[];

  @Column({ type: 'jsonb', nullable: true })
  responseSchema: ResponseSchema;

  @Column({ name: 'data_source_id' })
  dataSourceId: string;

  @ManyToOne(() => DatabaseConnection)
  @JoinColumn({ name: 'data_source_id' })
  dataSource: DatabaseConnection;

  @Column({ type: 'text' })
  sqlQuery: string;

  @Column({ type: 'jsonb', nullable: true })
  sqlParams: SqlParam[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ length: 100, nullable: true })
  createdBy: string;

  @Column({ length: 100, nullable: true })
  updatedBy: string;

  // 验证方法
  validateCode(): boolean {
    // 支持多级代码格式，如：module:submodule:action
    // 每级必须以字母开头，只能包含字母、数字和下划线
    return /^[a-zA-Z][a-zA-Z0-9_]*(:[a-zA-Z][a-zA-Z0-9_]*)*$/.test(this.code);
  }

  validateName(): boolean {
    return /^[a-z][a-z0-9_]*$/.test(this.name);
  }

  validatePath(): boolean {
    return /^\/[a-zA-Z0-9_/-]*$/.test(this.path);
  }

  validateMethod(): boolean {
    return ['GET', 'POST', 'PUT', 'DELETE'].includes(this.method);
  }

  validateQueryParams(): boolean {
    if (!this.queryParams) return true;
    return Array.isArray(this.queryParams) && this.queryParams.every(param => 
      param.name && param.type && typeof param.required === 'boolean'
    );
  }

  validateRequestBody(): boolean {
    if (!this.requestBody) return true;
    return Array.isArray(this.requestBody) && this.requestBody.every(field => 
      field.name && field.type && typeof field.required === 'boolean'
    );
  }

  validateResponseSchema(): boolean {
    if (!this.responseSchema) return true;
    return Boolean(
      this.responseSchema.type && 
      typeof this.responseSchema.properties === 'object' && 
      this.responseSchema.properties !== null
    );
  }

  validateSqlParams(): boolean {
    if (!this.sqlParams) return true;
    return Array.isArray(this.sqlParams) && this.sqlParams.every(param => 
      param.name && param.type && typeof param.required === 'boolean'
    );
  }

  validate(): boolean {
    return (
      this.validateCode() &&
      this.validateName() &&
      this.validatePath() &&
      this.validateMethod() &&
      this.validateQueryParams() &&
      this.validateRequestBody() &&
      this.validateResponseSchema() &&
      this.validateSqlParams()
    );
  }
} 