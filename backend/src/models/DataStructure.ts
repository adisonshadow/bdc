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
  length?: number;
  numberConfig?: {
    numberType: 'integer' | 'float' | 'decimal';
    precision?: number;
    scale?: number;
  };
  dateConfig?: {
    dateType: DateType;
  };
  enumConfig?: {
    targetEnumCode: string;
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
    targetSchemaCode: string;
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
    comment: '数据表的唯一标识',
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

  @Column({ 
    name: 'fields', 
    type: 'jsonb', 
    nullable: false, 
    comment: '数据表的字段信息' 
  })
  fields: Field[];

  @Column({ 
    name: 'key_indexes', 
    type: 'jsonb', 
    nullable: true,
    comment: '存储表的主键和索引信息'
  })
  keyIndexes: {
    primaryKey?: string[];
    indexes?: Array<{
      name: string;
      fields: string[];
      type: 'unique' | 'normal' | 'fulltext' | 'spatial';
    }>;
  };

  @Column({ 
    name: 'physical_storage', 
    type: 'jsonb', 
    nullable: true,
    comment: '存储表的物理存储信息'
  })
  physicalStorage: {
    database?: string;
    table?: string;
    lastMaterializedAt?: Date;
    materializedVersion?: number;
  };

  @Column({ 
    name: 'validation_errors', 
    type: 'jsonb', 
    nullable: true,
    comment: '存储表检测未通过的原因'
  })
  validationErrors: Array<{
    code: string;
    message: string;
    timestamp: Date;
    details?: Record<string, any>;
  }>;

  @Column({ 
    name: 'description', 
    type: 'varchar', 
    length: 100,  
    nullable: true, 
    comment: '数据表的描述' 
  })
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