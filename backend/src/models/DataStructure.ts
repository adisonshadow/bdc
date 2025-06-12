import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum FieldType {
  UUID = 'uuid',
  AUTO_INCREMENT = 'auto_increment',
  STRING = 'string',
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ENUM = 'enum',
  RELATION = 'relation',
  MEDIA = 'media',
  API = 'api'
}

export enum DateType {
  YEAR = 'year',
  YEAR_MONTH = 'year-month',
  DATE = 'date',
  DATETIME = 'datetime'
}

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  description?: string;
  required: boolean;
  isPrimaryKey?: boolean;
  length?: number;
  dateType?: DateType;
  enumConfig?: {
    enumId: string;
    multiple: boolean;
    defaultValues?: string[];
  };
  mediaConfig?: {
    mediaType: 'image' | 'video' | 'audio' | 'document' | 'file';
    formats: string[];
    maxSize: number;
    multiple: boolean;
  };
  relationConfig?: {
    targetSchema: string;
    targetField?: string;
    multiple: boolean;
    cascadeDelete: 'restrict' | 'cascade' | 'setNull';
    displayFields: string[];
    filterCondition?: Record<string, any>;
  };
  apiConfig?: {
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    multiple: boolean;
    params?: {
      [key: string]: {
        type: 'static' | 'field';
        value?: any;
        field?: string;
        transform?: string;
      };
    };
    headers?: Record<string, string>;
    resultMapping: {
      path: string;
      fields: Record<string, string>;
    };
    cache?: {
      ttl: number;
      key: string;
    };
  };
}

@Entity({ name: 'data_structures', schema: 'bdc' })
export class DataStructure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ 
    name: 'code', 
    type: 'varchar', 
    length: 100, 
    nullable: false, 
    unique: true 
  })
  code: string;

  @Column({ 
    name: 'name', 
    type: 'varchar', 
    length: 100, 
    nullable: false, 
    unique: true 
  })
  name: string;

  @Column({ name: 'fields', type: 'jsonb', nullable: false })
  fields: Field[];

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true })
  isActive: boolean;

  @Column({ name: 'version', type: 'integer', nullable: false, default: 1 })
  version: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 