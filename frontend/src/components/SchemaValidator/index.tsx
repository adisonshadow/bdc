import React, { useEffect, useState } from 'react';
import { Tag, Tooltip, List, Badge, Space, Button, message } from 'antd';
import { ExclamationCircleOutlined, WarningOutlined, RobotOutlined } from '@ant-design/icons';
import { validateSchema, groupIssuesByType, type ValidationIssue } from './rules';
import type { Field, SchemaListItem } from './types';
import { getSchemaHelp } from '@/AIHelper';

interface SchemaValidatorProps {
  fields: Field[];
  schemas?: SchemaListItem[];
  keyIndexes?: {
    primaryKey?: string[];
    indexes?: {
      name?: string;
      fields?: string[];
      type?: "unique" | "index" | "fulltext" | "spatial";
    }[];
  };
  enums?: any[];
  onValidationChange?: (issues: ValidationIssue[]) => void;
  onAutoFix?: (fixedFields: Field[], fixedKeyIndexes: any) => void;
}

const SchemaValidator: React.FC<SchemaValidatorProps> = ({ 
  fields, 
  schemas, 
  keyIndexes,
  enums,
  onValidationChange,
  onAutoFix
}) => {
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);

  // 执行验证
  const performValidation = () => {
    setIsValidating(true);
    try {
      const issues = validateSchema(fields, schemas, keyIndexes, enums);
      setValidationIssues(issues);
      
      // 通知父组件验证结果
      if (onValidationChange) {
        onValidationChange(issues);
      }
    } catch (error) {
      console.error('验证过程中发生错误:', error);
    } finally {
      setIsValidating(false);
    }
  };

  // 自动修复处理函数
  const handleAutoFix = async () => {
    if (!onAutoFix) {
      message.error('自动修复功能未启用');
      return;
    }

    setIsAutoFixing(true);
    try {
      // 构建当前模型的 JSON 数据
      const currentModel = {
        fields,
        keyIndexes,
        validationIssues: validationIssues.map(issue => ({
          type: issue.type,
          message: issue.message,
          fieldName: issue.fieldName,
          details: issue.details
        }))
      };

      // 构建 AI 提示词
      const prompt = `请帮我修复这个数据模型中的验证错误。以下是当前的模型定义和验证错误：

当前模型：
${JSON.stringify(currentModel, null, 2)}

验证错误：
${validationIssues.map(issue => `- ${issue.type}: ${issue.message}${issue.details ? ` (${issue.details})` : ''}`).join('\n')}

请返回修复后的完整模型 JSON，格式如下：
{
  "fields": [...],
  "keyIndexes": {...}
}

只返回 JSON 格式的数据，不要包含其他说明文字。`;

      // 调用 AI 服务
      const aiResponse = await getSchemaHelp(prompt);
      
      // 尝试解析 AI 返回的 JSON
      let fixedModel;
      try {
        // 提取 JSON 部分
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          fixedModel = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('未找到有效的 JSON 数据');
        }
      } catch (parseError) {
        console.error('解析 AI 响应失败:', parseError);
        message.error('AI 返回的数据格式不正确，请手动修复');
        return;
      }

      // 验证修复后的模型
      if (fixedModel.fields && Array.isArray(fixedModel.fields)) {
        // 调用父组件的修复回调
        onAutoFix(fixedModel.fields, fixedModel.keyIndexes || keyIndexes);
        message.success('自动修复完成！');
      } else {
        message.error('AI 返回的模型格式不正确');
      }
    } catch (error) {
      console.error('自动修复失败:', error);
      message.error('自动修复失败，请检查网络连接或手动修复');
    } finally {
      setIsAutoFixing(false);
    }
  };

  // 初始化时和依赖项变化时触发验证
  useEffect(() => {
    performValidation();
  }, [fields, schemas, keyIndexes, enums]);

  // 如果字段为空，不显示验证器
  if (!fields || fields.length === 0) {
    return null;
  }

  const { errors, warnings } = groupIssuesByType(validationIssues);
  const hasIssues = errors.length > 0 || warnings.length > 0;

  // 渲染验证结果
  const renderValidationContent = () => {
    if (!hasIssues) {
      return (
        <div style={{ padding: '8px 0' }}>
          <Space>
            <Badge status="success" />
            <span style={{ color: '#52c41a' }}>验证通过</span>
          </Space>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: '400px' }}>
        {errors.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ff4d4f' }}>
              <ExclamationCircleOutlined style={{ marginRight: '4px' }} />
              错误 ({errors.length})
            </div>
            <List
              size="small"
              dataSource={errors}
              renderItem={(issue: ValidationIssue) => (
                <List.Item style={{ padding: '4px 0', border: 'none' }}>
                  <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                    <div style={{ color: '#ff4d4f', fontWeight: '500' }}>
                      {issue.message}
                    </div>
                    {issue.details && (
                      <div style={{ color: '#666', marginTop: '2px' }}>
                        {issue.details}
                      </div>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}
        
        {warnings.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#faad14' }}>
              <WarningOutlined style={{ marginRight: '4px' }} />
              警告 ({warnings.length})
            </div>
            <List
              size="small"
              dataSource={warnings}
              renderItem={(issue: ValidationIssue) => (
                <List.Item style={{ padding: '4px 0', border: 'none' }}>
                  <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                    <div style={{ color: '#faad14', fontWeight: '500' }}>
                      {issue.message}
                    </div>
                    {issue.details && (
                      <div style={{ color: '#666', marginTop: '2px' }}>
                        {issue.details}
                      </div>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}
        
        {/* 自动修复按钮 */}
        {onAutoFix && (errors.length > 0 || warnings.length > 0) && (
          <div style={{ 
            marginTop: '12px', 
            paddingTop: '12px', 
            textAlign: 'center'
          }}>
            <Button
              type="primary"
              size="small"
              icon={<RobotOutlined />}
              loading={isAutoFixing}
              onClick={handleAutoFix}
              style={{ 
                width: '100%',
                background: 'radial-gradient(117.61% 84.5% at 147.46% 76.45%, rgba(82, 99, 255, 0.8) 0%, rgba(143, 65, 238, 0) 100%), linear-gradient(72deg, rgb(60, 115, 255) 18.03%, rgb(110, 65, 238) 75.58%, rgb(214, 65, 238) 104.34%)'
              }}
            >
              {isAutoFixing ? 'AI 修复中...' : '自动修复'}
            </Button>
            <div style={{ 
              fontSize: '11px', 
              color: '#999', 
              marginTop: '4px',
              lineHeight: '1.3'
            }}>
              点击后 AI 将自动分析并修复验证问题
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Tooltip
      title={renderValidationContent()}
      placement="bottom"
      overlayStyle={{ maxWidth: '500px' }}
      overlayInnerStyle={{ padding: '12px' }}
    >
      <div style={{ display: 'inline-block' }}>
        {isValidating ? (
          <Tag color="processing">验证中...</Tag>
        ) : hasIssues ? (
          <Tag color="error">
            <Space size="small">
              {errors.length > 0 && (
                <Badge count={errors.length} size="small" style={{ backgroundColor: '#ff4d4f' }} />
              )}
              {warnings.length > 0 && (
                <Badge count={warnings.length} size="small" style={{ backgroundColor: '#faad14' }} />
              )}
              验证未通过
            </Space>
          </Tag>
        ) : (
          <Tag color="success">验证通过</Tag>
        )}
      </div>
    </Tooltip>
  );
};

export default SchemaValidator; 