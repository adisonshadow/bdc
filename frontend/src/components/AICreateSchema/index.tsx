import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Space, Typography } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { Sender } from '@ant-design/x';
import { getSchemaHelp, generateModelDesignPrompt } from '@/AIHelper';
import type { Field } from '@/components/SchemaValidator/types';
import AILoading from '@/components/AILoading';
import SchemaConfirmation from '@/components/SchemaConfirmation';
import { getEnums, postEnums } from '@/services/BDC/api/enumManagement';

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

interface AICreateSchemaProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (schemaData: {
    name: string;
    code: string;
    description: string;
    fields: Field[];
    keyIndexes?: {
      primaryKey?: string[];
      indexes?: {
        name?: string;
        fields?: string[];
        type?: "unique" | "normal" | "fulltext" | "spatial";
      }[];
    };
  }) => void;
}

interface GeneratedSchema {
  name: string;
  code: string;
  description: string;
  fields: Field[];
  keyIndexes?: {
    primaryKey?: string[];
    indexes?: {
      name?: string;
      fields?: string[];
      type?: "unique" | "normal" | "fulltext" | "spatial";
    }[];
  };
}

const AICreateSchema: React.FC<AICreateSchemaProps> = ({
  open,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSchema, setGeneratedSchema] = useState<GeneratedSchema | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [modifyInput, setModifyInput] = useState('');
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [existingEnums, setExistingEnums] = useState<API.Enum[]>([]);
  const [newEnums, setNewEnums] = useState<API.Enum[]>([]);

  // 获取现有枚举列表
  const fetchExistingEnums = async () => {
    try {
      const enums = await getEnums({});
      setExistingEnums(enums);
    } catch (error) {
      console.error('获取枚举列表失败:', error);
    }
  };

  // 组件挂载时获取枚举列表
  useEffect(() => {
    if (open) {
      fetchExistingEnums();
    }
  }, [open]);

  // 生成模型
  const handleGenerate = async () => {
    try {
      const values = await form.validateFields();
      setIsGenerating(true);
      setIsAILoading(true);

      const prompt = generateModelDesignPrompt(
        {
          userRequirement: values.description,
          existingEnums
        },
        {
          operationType: 'create',
          includeNewEnums: true
        }
      );

      const aiResponse = await getSchemaHelp(prompt);
      
      // 尝试解析 AI 返回的 JSON
      let parsedSchema;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedSchema = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('未找到有效的 JSON 数据');
        }
      } catch (parseError) {
        console.error('解析 AI 响应失败:', parseError);
        message.error('AI 返回的数据格式不正确，请重试');
        return;
      }

      // 验证生成的模型
      if (parsedSchema.name && parsedSchema.code && parsedSchema.fields && Array.isArray(parsedSchema.fields)) {
        // 自动修正 enum 字段的 enumConfig
        const allNewEnums: any[] = [];
        const processedFields = parsedSchema.fields.map((field: any, index: number) => {
          // 处理 enum 字段
          if (field.type === 'enum' && field.enumConfig) {
            // 1. 如果 enumConfig 里有 newEnums，提取出来
            if (Array.isArray(field.enumConfig.newEnums) && field.enumConfig.newEnums.length > 0) {
              allNewEnums.push(...field.enumConfig.newEnums);
              // 2. 自动补全 targetEnumCode
              if (!field.enumConfig.targetEnumCode) {
                field.enumConfig.targetEnumCode = field.enumConfig.newEnums[0].code;
              }
              delete field.enumConfig.newEnums;
            }
          }
          return {
            id: field.id || `field_${index}`,
            name: field.name,
            type: field.type,
            description: field.description || '',
            required: field.required || false,
            length: field.length,
            dateConfig: field.dateConfig,
            enumConfig: field.enumConfig,
            relationConfig: field.relationConfig,
            mediaConfig: field.mediaConfig,
            apiConfig: field.apiConfig
          };
        });

        const schema: GeneratedSchema = {
          name: parsedSchema.name,
          code: parsedSchema.code,
          description: parsedSchema.description || values.description,
          fields: processedFields,
          keyIndexes: parsedSchema.keyIndexes || {
            primaryKey: ['id'],
            indexes: []
          }
        };

        // 合并所有 newEnums
        if ((parsedSchema.newEnums && Array.isArray(parsedSchema.newEnums)) || allNewEnums.length > 0) {
          setNewEnums([...(parsedSchema.newEnums || []), ...allNewEnums]);
        } else {
          setNewEnums([]);
        }

        setGeneratedSchema(schema);
        message.success('模型生成成功！');
      } else {
        message.error('AI 生成的模型格式不正确');
      }
    } catch (error) {
      console.error('生成模型失败:', error);
      message.error('生成模型失败，请检查网络连接或重试');
    } finally {
      setIsGenerating(false);
      setIsAILoading(false);
    }
  };

  // 确认创建
  const handleConfirm = async () => {
    if (!generatedSchema) return;
    
    setIsConfirming(true);
    try {
      // 先创建新枚举
      if (newEnums.length > 0) {
        message.info(`正在创建 ${newEnums.length} 个新枚举...`);
        const createdEnums = [];
        const failedEnums = [];
        
        for (const enumItem of newEnums) {
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
      }

      // 再创建数据模型
      await onSuccess({
        name: generatedSchema.name,
        code: generatedSchema.code,
        description: generatedSchema.description,
        fields: generatedSchema.fields,
        keyIndexes: generatedSchema.keyIndexes
      });
      message.success('数据模型创建成功！');
      handleCancel();
    } catch (error) {
      console.error('创建数据模型失败:', error);
      // 显示详细的错误信息
      const errorMessage = error instanceof Error ? error.message : '创建数据模型失败';
      message.error(`创建失败：${errorMessage}`);
      // 失败时不关闭面板，让用户可以重试或修改
    } finally {
      setIsConfirming(false);
    }
  };

  // 重新生成
  const handleRegenerate = () => {
    setGeneratedSchema(null);
    handleGenerate();
  };

  // 修改模型
  const handleModify = async () => {
    if (!modifyInput.trim() || !generatedSchema) return;
    
    setIsModifying(true);
    setIsAILoading(true);
    
    try {
      const prompt = generateModelDesignPrompt(
        {
          currentModel: generatedSchema,
          modifyRequirement: modifyInput,
          existingEnums
        },
        {
          operationType: 'modify'
        }
      );

      const aiResponse = await getSchemaHelp(prompt);
      
      // 尝试解析 AI 返回的 JSON
      let parsedSchema;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedSchema = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('未找到有效的 JSON 数据');
        }
      } catch (parseError) {
        console.error('解析 AI 响应失败:', parseError);
        message.error('AI 返回的数据格式不正确，请重试');
        return;
      }

      // 验证生成的模型
      if (parsedSchema.name && parsedSchema.code && parsedSchema.fields && Array.isArray(parsedSchema.fields)) {
        // 自动修正 enum 字段的 enumConfig
        const allNewEnums: any[] = [];
        const processedFields = parsedSchema.fields.map((field: any, index: number) => {
          // 处理 enum 字段
          if (field.type === 'enum' && field.enumConfig) {
            // 1. 如果 enumConfig 里有 newEnums，提取出来
            if (Array.isArray(field.enumConfig.newEnums) && field.enumConfig.newEnums.length > 0) {
              allNewEnums.push(...field.enumConfig.newEnums);
              // 2. 自动补全 targetEnumCode
              if (!field.enumConfig.targetEnumCode) {
                field.enumConfig.targetEnumCode = field.enumConfig.newEnums[0].code;
              }
              delete field.enumConfig.newEnums;
            }
          }
          return {
            id: field.id || `field_${index}`,
            name: field.name,
            type: field.type,
            description: field.description || '',
            required: field.required || false,
            length: field.length,
            dateConfig: field.dateConfig,
            enumConfig: field.enumConfig,
            relationConfig: field.relationConfig,
            mediaConfig: field.mediaConfig,
            apiConfig: field.apiConfig
          };
        });

        const schema: GeneratedSchema = {
          name: parsedSchema.name,
          code: parsedSchema.code,
          description: parsedSchema.description || generatedSchema.description,
          fields: processedFields,
          keyIndexes: parsedSchema.keyIndexes || {
            primaryKey: ['id'],
            indexes: []
          }
        };

        // 合并所有 newEnums
        if ((parsedSchema.newEnums && Array.isArray(parsedSchema.newEnums)) || allNewEnums.length > 0) {
          setNewEnums([...(parsedSchema.newEnums || []), ...allNewEnums]);
        } else {
          setNewEnums([]);
        }

        setGeneratedSchema(schema);
        setModifyInput('');
        setShowModifyDialog(false);
        message.success('模型修改成功！');
      } else {
        message.error('AI 生成的模型格式不正确');
      }
    } catch (error) {
      console.error('修改模型失败:', error);
      message.error('修改模型失败，请检查网络连接或重试');
    } finally {
      setIsModifying(false);
      setIsAILoading(false);
    }
  };

  // 取消
  const handleCancel = () => {
    form.resetFields();
    setGeneratedSchema(null);
    onCancel();
  };



  return (
      <Modal
        title={
          <Space>
            <RobotOutlined style={{ color: '#1890ff' }} />
            <span>AI 智能新建模型</span>
          </Space>
        }
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={800}
        destroyOnClose
      >
      <div style={{ padding: '20px 0' }}>
        {!generatedSchema ? (
          // 第一步：输入需求
          <div>
            <Title level={4}>第一步：描述你的需求</Title>
            <Paragraph type="secondary">
              请描述你想要创建的数据模型，AI 将根据你的描述自动生成完整的模型结构。
            </Paragraph>
            
            <Form form={form} layout="vertical">
              <Form.Item
                name="description"
                label="业务描述"
                rules={[{ required: true, message: '请详细描述业务需求' }]}
              >
                <Sender
                  placeholder="请详细描述你想要创建的数据模型，AI 将根据你的描述自动生成完整的模型结构。

例如：
- 存储用户的基本信息，包含姓名、邮箱、手机号、性别、生日等字段
- 需要支持用户注册、登录、个人信息修改等功能
- 邮箱和手机号需要唯一性约束
- 需要记录创建时间和更新时间

或者：
- 存储商品信息，包含商品名称、价格、库存、分类、图片等
- 需要支持商品上架下架、库存管理、分类管理等功能
- 价格需要精确到分，库存不能为负数
- 需要记录创建时间和更新时间"
                  autoSize={{ minRows: 8, maxRows: 12 }}
                />
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Space>
                <Button
                  type="primary"
                  size="large"
                  icon={<RobotOutlined />}
                  loading={isGenerating}
                  onClick={handleGenerate}
                  style={{
                    background: 'radial-gradient(117.61% 84.5% at 147.46% 76.45%, rgba(82, 99, 255, 0.8) 0%, rgba(143, 65, 238, 0) 100%), linear-gradient(72deg, rgb(60, 115, 255) 18.03%, rgb(110, 65, 238) 75.58%, rgb(214, 65, 238) 104.34%)',
                    border: 'none',
                    height: 48,
                    padding: '0 32px'
                  }}
                >
                  {isGenerating ? 'AI 生成中...' : '开始生成模型'}
                </Button>
                {/* <Button
                  type="default"
                  size="large"
                  onClick={() => {
                    setIsAILoading(true);
                    setTimeout(() => {
                      setIsAILoading(false);
                    }, 300000);
                  }}
                >
                  测试 AILoading
                </Button> */}
              </Space>
            </div>
          </div>
        ) : (
          <SchemaConfirmation
            schema={{
              ...generatedSchema,
              newEnums
            }}
            stepTitle="第二步：确认生成的模型"
            stepDescription="AI 已根据你的需求生成了模型结构，请确认是否符合预期。"
            modifyInput={modifyInput}
            onModifyInputChange={setModifyInput}
            onModify={handleModify}
            onRegenerate={handleRegenerate}
            onConfirm={handleConfirm}
            isModifying={isModifying}
            isRegenerating={isGenerating}
            isConfirming={isConfirming}
            modifyButtonText="提交修改要求并重新生成"
            regenerateButtonText="重新生成"
            confirmButtonText="确认创建"
          />
        )}
      </div>
      <AILoading visible={isAILoading} text="AI 正在生成模型..." />
    </Modal>
  );
};

export default AICreateSchema; 