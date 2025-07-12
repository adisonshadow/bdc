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
    databaseType?: string;
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

    return `  ${fieldName} ${fieldType}${constraints.length > 0 ? ' ' + constraints.join(' ') : ''}`;
  });

  sql += fieldDefinitions.join(',\n');

  // 添加表级约束
  const tableConstraints: string[] = [];

  // 添加主键约束
  if (primaryKey && primaryKey.length > 0) {
    tableConstraints.push(`  PRIMARY KEY (${primaryKey.join(', ')})`);
  }

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

  // 添加表注释和字段注释
  const databaseType = config.databaseType || 'postgresql';
  sql += addComments(dataStructure, tableName, schema, fields, databaseType);

  // 添加索引
  if (config.includeIndexes) {
    indexes.forEach((index, indexIndex) => {
      // 使用数据结构中指定的索引名称，如果没有指定则生成包含表名的索引名称
      const indexName = index.name || `${getIndexTypePrefix(index.type)}_${tableName}_${indexIndex + 1}_${index.fields.join('_')}`;
      
      switch (index.type) {
        case 'normal':
          sql += `CREATE INDEX ${indexName} ON ${schema}.${tableName} (${index.fields.join(', ')});\n`;
          break;
        case 'fulltext':
          // 全文索引（MySQL语法）
          sql += `CREATE FULLTEXT INDEX ${indexName} ON ${schema}.${tableName} (${index.fields.join(', ')});\n`;
          break;
        case 'spatial':
          // 空间索引（MySQL语法）
          sql += `CREATE SPATIAL INDEX ${indexName} ON ${schema}.${tableName} (${index.fields.join(', ')});\n`;
          break;
      }
    });
  }

  return sql;
}

function addComments(
  dataStructure: DataStructure,
  tableName: string,
  schema: string,
  fields: Field[],
  databaseType: string
): string {
  let commentSQL = '';
  
  switch (databaseType.toLowerCase()) {
    case 'postgresql':
      // PostgreSQL 注释语法
      if (dataStructure.description) {
        commentSQL += `COMMENT ON TABLE ${schema}.${tableName} IS '${escapeComment(dataStructure.description)}';\n`;
      }
      fields.forEach(field => {
        let comment = field.description || '';
        
        // 为枚举字段添加特殊注释
        if (field.type === 'enum' && field.enumConfig?.targetEnumCode) {
          comment = `${comment} (枚举代码：${field.enumConfig.targetEnumCode})`.trim();
        }
        
        if (comment) {
          commentSQL += `COMMENT ON COLUMN ${schema}.${tableName}.${field.name} IS '${escapeComment(comment)}';\n`;
        }
      });
      break;
      
    case 'mysql':
      // MySQL 注释语法
      if (dataStructure.description) {
        commentSQL += `ALTER TABLE ${schema}.${tableName} COMMENT = '${escapeComment(dataStructure.description)}';\n`;
      }
      fields.forEach(field => {
        let comment = field.description || '';
        
        // 为枚举字段添加特殊注释
        if (field.type === 'enum' && field.enumConfig?.targetEnumCode) {
          comment = `${comment} (枚举代码：${field.enumConfig.targetEnumCode})`.trim();
        }
        
        if (comment) {
          commentSQL += `ALTER TABLE ${schema}.${tableName} MODIFY COLUMN ${field.name} ${getFieldType(field)} COMMENT '${escapeComment(comment)}';\n`;
        }
      });
      break;
      
    case 'oracle':
      // Oracle 注释语法
      if (dataStructure.description) {
        commentSQL += `COMMENT ON TABLE ${schema}.${tableName} IS '${escapeComment(dataStructure.description)}';\n`;
      }
      fields.forEach(field => {
        let comment = field.description || '';
        
        // 为枚举字段添加特殊注释
        if (field.type === 'enum' && field.enumConfig?.targetEnumCode) {
          comment = `${comment} (枚举代码：${field.enumConfig.targetEnumCode})`.trim();
        }
        
        if (comment) {
          commentSQL += `COMMENT ON COLUMN ${schema}.${tableName}.${field.name} IS '${escapeComment(comment)}';\n`;
        }
      });
      break;
      
    case 'sqlserver':
      // SQL Server 注释语法
      if (dataStructure.description) {
        commentSQL += `EXEC sp_addextendedproperty 'MS_Description', '${escapeComment(dataStructure.description)}', 'SCHEMA', '${schema}', 'TABLE', '${tableName}';\n`;
      }
      fields.forEach(field => {
        let comment = field.description || '';
        
        // 为枚举字段添加特殊注释
        if (field.type === 'enum' && field.enumConfig?.targetEnumCode) {
          comment = `${comment} (枚举代码：${field.enumConfig.targetEnumCode})`.trim();
        }
        
        if (comment) {
          commentSQL += `EXEC sp_addextendedproperty 'MS_Description', '${escapeComment(comment)}', 'SCHEMA', '${schema}', 'TABLE', '${tableName}', 'COLUMN', '${field.name}';\n`;
        }
      });
      break;
      
    default:
      // 默认使用 PostgreSQL 语法
      if (dataStructure.description) {
        commentSQL += `COMMENT ON TABLE ${schema}.${tableName} IS '${escapeComment(dataStructure.description)}';\n`;
      }
      fields.forEach(field => {
        let comment = field.description || '';
        
        // 为枚举字段添加特殊注释
        if (field.type === 'enum' && field.enumConfig?.targetEnumCode) {
          comment = `${comment} (枚举代码：${field.enumConfig.targetEnumCode})`.trim();
        }
        
        if (comment) {
          commentSQL += `COMMENT ON COLUMN ${schema}.${tableName}.${field.name} IS '${escapeComment(comment)}';\n`;
        }
      });
      break;
  }
  
  return commentSQL;
}

function escapeComment(comment: string): string {
  // 转义单引号，避免 SQL 注入
  return comment.replace(/'/g, "''");
}

function getIndexTypePrefix(indexType: string): string {
  switch (indexType) {
    case 'normal':
      return 'idx';
    case 'unique':
      return 'uk';
    case 'fulltext':
      return 'ft';
    case 'spatial':
      return 'sp';
    default:
      return 'idx';
  }
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
      if (field.dateConfig?.dateType === 'date') {
        return 'DATE';
      } else if (field.dateConfig?.dateType === 'year') {
        return 'INTEGER';
      } else if (field.dateConfig?.dateType === 'year-month') {
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