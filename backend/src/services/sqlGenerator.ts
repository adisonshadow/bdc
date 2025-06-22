import { DataStructure, Field } from '../models/DataStructure';

export function generateCreateTableSQL(
  dataStructure: DataStructure,
  tableName: string,
  schema: string,
  config: {
    overwrite?: boolean;
    includeIndexes?: boolean;
    includeConstraints?: boolean;
    targetSchema?: string;
    tablePrefix?: string;
  }
): string {
  const fields = dataStructure.fields || [];
  const primaryKey = dataStructure.keyIndexes?.primaryKey;
  const indexes = dataStructure.keyIndexes?.indexes || [];

  let sql = `CREATE TABLE ${schema}.${tableName} (\n`;

  // 生成字段定义
  const fieldDefinitions = fields.map(field => {
    const fieldName = field.name;
    const fieldType = getFieldType(field);
    const constraints: string[] = [];

    // 添加非空约束
    if (field.required) {
      constraints.push('NOT NULL');
    }

    // 添加主键约束
    if (primaryKey === fieldName) {
      constraints.push('PRIMARY KEY');
    }

    return `  ${fieldName} ${fieldType}${constraints.length > 0 ? ' ' + constraints.join(' ') : ''}`;
  });

  sql += fieldDefinitions.join(',\n');

  // 添加表级约束
  const tableConstraints: string[] = [];

  // 添加唯一约束
  if (config.includeConstraints) {
    indexes.forEach(index => {
      if (index.type === 'unique') {
        tableConstraints.push(`  CONSTRAINT ${index.name || `uk_${tableName}_${index.fields.join('_')}`} UNIQUE (${index.fields.join(', ')})`);
      }
    });
  }

  if (tableConstraints.length > 0) {
    sql += ',\n' + tableConstraints.join(',\n');
  }

  sql += '\n);\n';

  // 添加索引
  if (config.includeIndexes) {
    indexes.forEach(index => {
      if (index.type === 'index') {
        sql += `CREATE INDEX ${index.name || `idx_${tableName}_${index.fields.join('_')}`} ON ${schema}.${tableName} (${index.fields.join(', ')});\n`;
      }
    });
  }

  return sql;
}

function getFieldType(field: Field): string {
  switch (field.type) {
    case 'uuid':
      return 'UUID';
    case 'auto_increment':
      return 'SERIAL';
    case 'string':
      return `VARCHAR(${field.length || 255})`;
    case 'text':
      return 'TEXT';
    case 'number':
      // 对于数字类型，默认使用NUMERIC
      return 'NUMERIC';
    case 'boolean':
      return 'BOOLEAN';
    case 'date':
      if (field.dateType === 'date') {
        return 'DATE';
      } else if (field.dateType === 'year') {
        return 'INTEGER';
      } else if (field.dateType === 'year-month') {
        return 'VARCHAR(7)';
      } else {
        return 'TIMESTAMP WITH TIME ZONE';
      }
    case 'enum':
      // 对于枚举类型，使用VARCHAR存储
      return `VARCHAR(50)`;
    case 'relation':
      // 对于关系类型，使用UUID存储外键
      return 'UUID';
    case 'media':
      // 对于媒体类型，使用TEXT存储路径或JSON存储元数据
      return 'TEXT';
    case 'api':
      // 对于API类型，使用JSONB存储
      return 'JSONB';
    default:
      return 'TEXT';
  }
} 