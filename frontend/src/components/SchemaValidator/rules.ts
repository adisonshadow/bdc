import type { Field } from './types';

export interface ValidationRule {
  id: string;
  type: 'error' | 'warning';
  name: string;
  description: string;
  validator: (fields: Field[], schemas?: any[], keyIndexes?: any, enums?: any[]) => ValidationIssue[];
}

export interface ValidationIssue {
  ruleId: string;
  type: 'error' | 'warning';
  message: string;
  fieldName?: string;
  fieldType?: string;
  details?: string;
}

// 验证规则清单
export const validationRules: ValidationRule[] = [
  // 主键相关规则
  {
    id: 'missing-primary-key',
    type: 'warning',
    name: '缺少主键',
    description: '数据表应该设置主键字段以确保数据的唯一性和完整性',
    validator: (fields: Field[], schemas?: any[], keyIndexes?: any) => {
      const issues: ValidationIssue[] = [];
      
      // 检查是否有主键字段
      const hasPrimaryKey = keyIndexes?.primaryKey && keyIndexes.primaryKey.length > 0;
      
      if (!hasPrimaryKey) {
        issues.push({
          ruleId: 'missing-primary-key',
          type: 'warning',
          message: '数据表缺少主键字段',
          details: '建议设置一个 UUID 或自增长 ID 字段作为主键'
        });
      }
      
      return issues;
    }
  },
  
  {
    id: 'primary-key-nullable',
    type: 'error',
    name: '主键允许空值',
    description: '主键字段不能允许空值，这会导致数据完整性问题',
    validator: (fields: Field[], schemas?: any[], keyIndexes?: any) => {
      const issues: ValidationIssue[] = [];
      
      if (!keyIndexes?.primaryKey) return issues;
      
      keyIndexes.primaryKey.forEach((primaryKeyName: string) => {
        const field = fields.find((f: Field) => f.name === primaryKeyName);
        if (field && !field.required) {
          issues.push({
            ruleId: 'primary-key-nullable',
            type: 'error',
            message: `主键字段 "${primaryKeyName}" 允许空值`,
            fieldName: primaryKeyName,
            fieldType: field.type,
            details: '主键字段必须设置为必填'
          });
        }
      });
      
      return issues;
    }
  },
  
  {
    id: 'unique-index-nullable',
    type: 'error',
    name: '唯一索引允许空值',
    description: '唯一索引字段允许空值可能导致数据一致性问题',
    validator: (fields: Field[], schemas?: any[], keyIndexes?: any) => {
      const issues: ValidationIssue[] = [];
      
      if (!keyIndexes?.indexes) return issues;
      
      keyIndexes.indexes.forEach((index: any) => {
        if (index.type === 'unique') {
          index.fields?.forEach((fieldName: string) => {
            const field = fields.find((f: Field) => f.name === fieldName);
            if (field && !field.required) {
              issues.push({
                ruleId: 'unique-index-nullable',
                type: 'error',
                message: `唯一索引字段 "${fieldName}" 允许空值`,
                fieldName: fieldName,
                fieldType: field.type,
                details: '唯一索引字段建议设置为必填，以避免空值导致的唯一性约束问题'
              });
            }
          });
        }
      });
      
      return issues;
    }
  },
  
  // 字段类型与索引匹配性规则
  {
    id: 'unsuitable-primary-key-type',
    type: 'warning',
    name: '主键字段类型不合适',
    description: '某些字段类型不适合作为主键',
    validator: (fields: Field[], schemas?: any[], keyIndexes?: any) => {
      const issues: ValidationIssue[] = [];
      
      if (!keyIndexes?.primaryKey) return issues;
      
      const unsuitableTypes = ['text', 'media', 'api', 'date', 'enum', 'relation', 'boolean'];
      const idealTypes = ['uuid', 'auto_increment'];
      
      // 检查是否有理想的主键类型字段
      const hasIdealPrimaryKey = keyIndexes.primaryKey.some((primaryKeyName: string) => {
        const field = fields.find((f: Field) => f.name === primaryKeyName);
        return field && idealTypes.includes(field.type);
      });
      
      // 如果是联合主键且包含理想类型，则跳过警告
      if (keyIndexes.primaryKey.length > 1 && hasIdealPrimaryKey) {
        return issues;
      }
      
      keyIndexes.primaryKey.forEach((primaryKeyName: string) => {
        const field = fields.find((f: Field) => f.name === primaryKeyName);
        if (field && unsuitableTypes.includes(field.type)) {
          let reason = '';
          switch (field.type) {
            case 'text':
              reason = '文本类型字段通常用于存储大量文本，不适合作为主键';
              break;
            case 'media':
              reason = '媒体类型字段用于存储文件信息，不适合作为主键';
              break;
            case 'api':
              reason = 'API类型字段用于外部数据关联，不适合作为主键';
              break;
            case 'date':
              reason = '日期类型字段值可能重复且不够稳定，不适合作为主键';
              break;
            case 'enum':
              reason = '枚举类型字段值有限且可能重复，不适合作为主键';
              break;
            case 'relation':
              reason = '关联类型字段不适合作为主键，建议使用关联的目标字段';
              break;
            case 'boolean':
              reason = '布尔类型字段只有两个可能的值，无法唯一标识记录';
              break;
          }
          
          issues.push({
            ruleId: 'unsuitable-primary-key-type',
            type: 'warning',
            message: `主键字段 "${primaryKeyName}" 的类型 "${field.type}" 不适合作为主键`,
            fieldName: primaryKeyName,
            fieldType: field.type,
            details: reason
          });
        }
      });
      
      return issues;
    }
  },
  
  {
    id: 'unsuitable-fulltext-index-type',
    type: 'error',
    name: '全文索引字段类型不合适',
    description: '全文索引只适用于文本类型字段',
    validator: (fields: Field[], schemas?: any[], keyIndexes?: any) => {
      const issues: ValidationIssue[] = [];
      
      if (!keyIndexes?.indexes) return issues;
      
      keyIndexes.indexes.forEach((index: any) => {
        if (index.type === 'fulltext') {
          index.fields?.forEach((fieldName: string) => {
            const field = fields.find((f: Field) => f.name === fieldName);
            if (field && field.type !== 'text' && field.type !== 'string') {
              issues.push({
                ruleId: 'unsuitable-fulltext-index-type',
                type: 'error',
                message: `字段 "${fieldName}" 的类型 "${field.type}" 不适合做全文索引`,
                fieldName: fieldName,
                fieldType: field.type,
                details: '全文索引只适用于文本类型字段（text、string）'
              });
            }
          });
        }
      });
      
      return issues;
    }
  },
  
  {
    id: 'unsuitable-spatial-index-type',
    type: 'error',
    name: '空间索引字段类型不合适',
    description: '空间索引通常适用于存储几何数据的字段',
    validator: (fields: Field[], schemas?: any[], keyIndexes?: any) => {
      const issues: ValidationIssue[] = [];
      
      if (!keyIndexes?.indexes) return issues;
      
      keyIndexes.indexes.forEach((index: any) => {
        if (index.type === 'spatial') {
          index.fields?.forEach((fieldName: string) => {
            const field = fields.find((f: Field) => f.name === fieldName);
            if (field && field.type !== 'string') {
              issues.push({
                ruleId: 'unsuitable-spatial-index-type',
                type: 'error',
                message: `字段 "${fieldName}" 的类型 "${field.type}" 不适合做空间索引`,
                fieldName: fieldName,
                fieldType: field.type,
                details: '空间索引通常适用于存储几何数据的字符串字段'
              });
            }
          });
        }
      });
      
      return issues;
    }
  },
  
  // 枚举字段验证规则
  {
    id: 'enum-without-target',
    type: 'error',
    name: '枚举字段未设置目标枚举',
    description: '枚举类型字段必须指定目标枚举对象',
    validator: (fields: Field[], schemas?: any[], keyIndexes?: any, enums?: any[]) => {
      const issues: ValidationIssue[] = [];
      
      fields.forEach(field => {
        if (field.type === 'enum') {
          const enumField = field as API.EnumField;
          if (!enumField.enumConfig?.targetEnumCode) {
            issues.push({
              ruleId: 'enum-without-target',
              type: 'error',
              message: `枚举字段 "${field.name}" 未设置目标枚举`,
              fieldName: field.name,
              fieldType: field.type,
              details: '请选择要关联的枚举对象'
            });
          } else if (enums) {
            // 检查目标枚举是否存在
            const targetEnum = enums.find((e: any) => e.code === enumField.enumConfig?.targetEnumCode);
            if (!targetEnum) {
              issues.push({
                ruleId: 'enum-without-target',
                type: 'error',
                message: `枚举字段 "${field.name}" 指向的枚举 "${enumField.enumConfig?.targetEnumCode}" 不存在`,
                fieldName: field.name,
                fieldType: field.type,
                details: '请检查枚举对象是否存在或已被删除'
              });
            }
          }
        }
      });
      
      return issues;
    }
  },
  
  // 关联字段验证规则
  {
    id: 'relation-without-target',
    type: 'error',
    name: '关联字段未设置目标对象',
    description: '关联类型字段必须指定目标数据表和关联字段',
    validator: (fields: Field[], schemas?: any[]) => {
      const issues: ValidationIssue[] = [];
      
      fields.forEach(field => {
        if (field.type === 'relation') {
          const relationField = field as API.RelationField;
          
          if (!relationField.relationConfig?.targetSchemaCode) {
            issues.push({
              ruleId: 'relation-without-target',
              type: 'error',
              message: `关联字段 "${field.name}" 未设置目标数据表`,
              fieldName: field.name,
              fieldType: field.type,
              details: '请选择要关联的目标数据表'
            });
          } else {
            // 检查目标数据表是否存在
            const targetSchema = schemas?.find((s: any) => s.code === relationField.relationConfig?.targetSchemaCode);
            if (!targetSchema) {
              issues.push({
                ruleId: 'relation-without-target',
                type: 'error',
                message: `关联字段 "${field.name}" 指向的数据表 "${relationField.relationConfig?.targetSchemaCode}" 不存在`,
                fieldName: field.name,
                fieldType: field.type,
                details: '请检查目标数据表是否存在或已被删除'
              });
            } else if (relationField.relationConfig?.targetField) {
              // 检查目标字段是否存在
              const targetField = targetSchema.fields.find((f: Field) => f.name === relationField.relationConfig?.targetField);
              if (!targetField) {
                issues.push({
                  ruleId: 'relation-without-target',
                  type: 'error',
                  message: `关联字段 "${field.name}" 指向的字段 "${relationField.relationConfig?.targetField}" 不存在`,
                  fieldName: field.name,
                  fieldType: field.type,
                  details: `目标数据表 "${targetSchema.name}" 中不存在字段 "${relationField.relationConfig?.targetField}"`
                });
              }
            }
          }
        }
      });
      
      return issues;
    }
  },
  
  // 字段名称重复规则
  {
    id: 'duplicate-field-names',
    type: 'error',
    name: '字段名称重复',
    description: '同一数据表中不能有重复的字段名称',
    validator: (fields: Field[]) => {
      const issues: ValidationIssue[] = [];
      const fieldNames = new Set<string>();
      
      fields.forEach(field => {
        if (fieldNames.has(field.name)) {
          issues.push({
            ruleId: 'duplicate-field-names',
            type: 'error',
            message: `字段名称 "${field.name}" 重复`,
            fieldName: field.name,
            fieldType: field.type,
            details: '请修改重复的字段名称'
          });
        }
        fieldNames.add(field.name);
      });
      
      return issues;
    }
  },
  
  // 字段名称格式规则
  {
    id: 'invalid-field-name-format',
    type: 'error',
    name: '字段名称格式不正确',
    description: '字段名称必须符合命名规范',
    validator: (fields: Field[]) => {
      const issues: ValidationIssue[] = [];
      
      fields.forEach(field => {
        if (!/^[a-z][a-z0-9_]*$/.test(field.name)) {
          issues.push({
            ruleId: 'invalid-field-name-format',
            type: 'error',
            message: `字段名称 "${field.name}" 格式不正确`,
            fieldName: field.name,
            fieldType: field.type,
            details: '字段名必须以小写字母开头，只能包含小写字母、数字和下划线'
          });
        }
      });
      
      return issues;
    }
  },
  
  // 字符串字段长度规则
  {
    id: 'string-field-without-length',
    type: 'error',
    name: '字符串字段未设置长度',
    description: '字符串类型字段必须设置长度限制',
    validator: (fields: Field[]) => {
      const issues: ValidationIssue[] = [];
      
      fields.forEach(field => {
        if (field.type === 'string') {
          const stringField = field as API.StringField;
          if (!stringField.length) {
            issues.push({
              ruleId: 'string-field-without-length',
              type: 'error',
              message: `字符串字段 "${field.name}" 未设置长度`,
              fieldName: field.name,
              fieldType: field.type,
              details: '字符串字段必须设置长度限制（1-255）'
            });
          }
        }
      });
      
      return issues;
    }
  },
  
  // 日期字段类型规则
  {
    id: 'date-field-without-type',
    type: 'error',
    name: '日期字段未设置类型',
    description: '日期类型字段必须指定具体的日期格式',
    validator: (fields: Field[]) => {
      const issues: ValidationIssue[] = [];
      
      fields.forEach(field => {
        if (field.type === 'date') {
          const dateField = field as API.DateField;
          if (!dateField.dateType) {
            issues.push({
              ruleId: 'date-field-without-type',
              type: 'error',
              message: `日期字段 "${field.name}" 未设置日期类型`,
              fieldName: field.name,
              fieldType: field.type,
              details: '请选择日期格式：年、年月、年月日、年月日时间'
            });
          }
        }
      });
      
      return issues;
    }
  }
];

// 执行所有验证规则
export const validateSchema = (
  fields: Field[], 
  schemas?: any[], 
  keyIndexes?: any,
  enums?: any[]
): ValidationIssue[] => {
  const allIssues: ValidationIssue[] = [];
  
  validationRules.forEach(rule => {
    const issues = rule.validator(fields, schemas, keyIndexes, enums);
    allIssues.push(...issues);
  });
  
  return allIssues;
};

// 按类型分组问题
export const groupIssuesByType = (issues: ValidationIssue[]) => {
  return {
    errors: issues.filter(issue => issue.type === 'error'),
    warnings: issues.filter(issue => issue.type === 'warning')
  };
}; 