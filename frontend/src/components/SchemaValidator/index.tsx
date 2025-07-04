import React from 'react';
import { Tag, Tooltip, List } from 'antd';

type Field = API.UuidField | API.AutoIncrementField | API.StringField | API.TextField | API.NumberField | API.BooleanField | API.DateField | API.EnumField | API.RelationField | API.MediaField | API.ApiField;

interface SchemaListItem {
  id?: string;
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  fields: Field[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface SchemaValidatorProps {
  fields: Field[];
  schemas?: SchemaListItem[];
}

const SchemaValidator: React.FC<SchemaValidatorProps> = ({ fields, schemas }) => {
  // 验证字段
  const validateFields = (fields: Field[]): ValidationResult => {
    const errors: string[] = [];

    // 如果字段为空，直接返回
    if (!fields || fields.length === 0) {
      return { isValid: true, errors: [] };
    }

    // 检查主键 - 暂时注释，等待前端更新
    // const primaryKeys = fields.filter(field => 
    //   (field.type === 'uuid' || field.type === 'auto_increment') && field.isPrimaryKey
    // );
    // if (primaryKeys.length === 0) {
    //   errors.push('未设置主键字段');
    // } else if (primaryKeys.length > 1) {
    //   errors.push('设置了多个主键字段');
    // }

    // 检查关联字段
    fields.forEach(field => {
      if (field.type === 'relation') {
        const relationField = field as API.RelationField;
        if (relationField.relationConfig?.targetSchemaCode) {
          // 检查目标表是否存在
          const targetSchema = schemas?.find(s => s.code === relationField.relationConfig?.targetSchemaCode);
          if (!targetSchema) {
            errors.push(`字段 "${field.name}" 关联的表 "${relationField.relationConfig?.targetSchemaCode}" 不存在`);
          }
          // 检查目标字段是否存在
          else if (relationField.relationConfig?.targetField) {
            const targetField = targetSchema.fields.find(f => f.name === relationField.relationConfig?.targetField);
            if (!targetField) {
              errors.push(`字段 "${field.name}" 关联的字段 "${relationField.relationConfig?.targetField}" 不存在`);
            }
          }
        }
      }
    });

    // 检查字段名称是否重复
    const fieldNames = new Set<string>();
    fields.forEach(field => {
      if (fieldNames.has(field.name)) {
        errors.push(`字段名称 "${field.name}" 重复`);
      }
      fieldNames.add(field.name);
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const validationResult = validateFields(fields);

  if (!fields || fields.length === 0) {
    return null;
  }

  return (
    <Tooltip
      title={
        !validationResult.isValid && (
          <List
            size="small"
            dataSource={validationResult.errors}
            renderItem={error => (
              <List.Item style={{ color: '#fff' }}>
                {error}
              </List.Item>
            )}
          />
        )
      }
    >
      <Tag color={validationResult.isValid ? 'success' : 'warning'}>
        {validationResult.isValid ? '验证通过' : '验证未通过'}
      </Tag>
    </Tooltip>
  );
};

export default SchemaValidator; 