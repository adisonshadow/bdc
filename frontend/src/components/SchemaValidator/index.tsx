import React, { useEffect, useState } from 'react';
import { Tag, Tooltip, List, Badge, Space, Button, message } from 'antd';
import { ExclamationCircleOutlined, WarningOutlined, RobotOutlined } from '@ant-design/icons';
import { validateSchema, groupIssuesByType, type ValidationIssue } from './rules';
import type { Field, SchemaListItem } from './types';
import { getSchemaHelp, generateModelDesignPrompt } from '@/AIHelper';
import { AIError, AIErrorType } from '@/AIHelper/config';
import AIButton from '@/components/AIButton';
import AILoading from '@/components/AILoading';
import { useSimpleAILoading } from '@/components/AILoading/useAILoading';

interface SchemaValidatorProps {
  fields: Field[];
  schemas?: SchemaListItem[];
  keyIndexes?: {
    primaryKey?: string[];
    indexes?: {
      name?: string;
      fields?: string[];
      type?: "unique" | "normal" | "fulltext" | "spatial";
    }[];
  };
  enums?: any[];
  isLocked?: boolean;
  onValidationChange?: (issues: ValidationIssue[]) => void;
  onAutoFix?: (fixedFields: Field[], fixedKeyIndexes: any) => void;
}

const SchemaValidator: React.FC<SchemaValidatorProps> = ({ 
  fields, 
  schemas, 
  keyIndexes,
  enums,
  isLocked,
  onValidationChange,
  onAutoFix
}) => {
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const { isVisible: isAutoFixing, text: aiLoadingText, showLoading, hideLoading } = useSimpleAILoading();

  // 处理AI错误
  const handleAIError = (error: any) => {
    if (error instanceof AIError) {
      switch (error.type) {
        case AIErrorType.RATE_LIMIT_ERROR:
          message.error('AIError: 请求频率过高，请稍后重试');
          break;
        case AIErrorType.NETWORK_ERROR:
          message.error('AIError: 网络连接失败，请检查网络连接');
          break;
        case AIErrorType.AUTH_ERROR:
          message.error('AIError: 认证失败，请检查API配置');
          break;
        case AIErrorType.MODEL_ERROR:
          message.error('AIError: AI服务暂时不可用，请稍后重试');
          break;
        default:
          message.error(`AIError: ${error.message}`);
      }
    } else {
      message.error('AIError: 未知错误，请稍后重试');
    }
  };

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

    showLoading('AI 正在分析并修复验证错误...');
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
      const prompt = generateModelDesignPrompt(
        {
          currentModel,
          validationIssues,
          existingEnums: enums || []
        },
        {
          operationType: 'fix',
          includeNewEnums: true
        }
      );

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
        // 如果有新枚举，先创建它们
        if (fixedModel.newEnums && Array.isArray(fixedModel.newEnums) && fixedModel.newEnums.length > 0) {
          message.info(`正在创建 ${fixedModel.newEnums.length} 个新枚举...`);
          const createdEnums = [];
          const failedEnums = [];
          
          try {
            const { postEnums } = await import('@/services/BDC/api/enumManagement');
            for (const enumItem of fixedModel.newEnums) {
              try {
                await postEnums(enumItem);
                console.log(`枚举创建成功: ${enumItem.code}`);
                createdEnums.push(enumItem.code);
              } catch (error: any) {
                console.error(`枚举创建失败: ${enumItem.code}`, error);
                // 如果枚举已存在，记录但继续处理
                if (error?.response?.status === 409) {
                  console.log(`枚举已存在: ${enumItem.code}`);
                  createdEnums.push(enumItem.code); // 视为成功，因为枚举已存在
                } else {
                  failedEnums.push(enumItem.code);
                }
              }
            }
            
            if (createdEnums.length > 0) {
              message.success(`枚举处理完成：${createdEnums.length} 个成功`);
            }
            
            if (failedEnums.length > 0) {
              message.warning(`部分枚举创建失败：${failedEnums.join(', ')}`);
            }
          } catch (error) {
            console.error('创建新枚举失败:', error);
            message.warning('创建新枚举失败，但继续应用修复结果');
          }
        }

        // 调用父组件的修复回调
        onAutoFix(fixedModel.fields, fixedModel.keyIndexes || keyIndexes);
        message.success('自动修复完成！');
      } else {
        message.error('AI 返回的模型格式不正确');
      }
    } catch (error) {
      console.error('自动修复失败:', error);
      handleAIError(error);
    } finally {
      hideLoading();
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
                      <div style={{ color: '#999', marginTop: '2px' }}>
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
                      <div style={{ color: '#999', marginTop: '2px' }}>
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
        {onAutoFix && (errors.length > 0 || warnings.length > 0) && !isLocked && (
          <div style={{ 
            marginTop: '12px', 
            paddingTop: '12px', 
            textAlign: 'center'
          }}>
            <AIButton
              type="primary"
              icon={<RobotOutlined />}
              loading={isAutoFixing}
              onClick={handleAutoFix}
              style={{ 
                width: '100%',
              }}
            >
              {isAutoFixing ? 'AI 修复中...' : 'AI 自动修复'}
            </AIButton>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <AILoading 
        visible={isAutoFixing} 
        text={aiLoadingText} 
      />
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
    </>
  );
};

export default SchemaValidator; 