export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'relation';
  length?: number;
  allowNull: boolean;
  relationType?: 'has-one' | 'has-many';
  enumValues?: string[];
}

export interface SchemaListItem {
  id: string;
  name: string;
  code: string;
  fields: SchemaField[];
  description: string;
  version: string;
  status: boolean;
  createTime: string;
  updateTime: string;
}

export interface SchemaListParams {
  page: number;
  pageSize: number;
  keyword?: string;
}

export interface SchemaListResponse {
  list: SchemaListItem[];
  total: number;
}

export interface UpdateStatusParams {
  id: string;
  status: boolean;
}

export interface CreateSchemaParams {
  name: string;
  code: string;
  description?: string;
  schema: {
    fields: SchemaField[];
  };
}

export interface UpdateSchemaParams {
  name?: string;
  code?: string;
  description?: string;
  schema?: {
    fields: SchemaField[];
  };
  isActive?: boolean;
} 