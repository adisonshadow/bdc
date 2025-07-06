import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, message, Typography, Input, Divider } from 'antd';
import { Sender } from '@ant-design/x';
import { ThunderboltOutlined, RobotOutlined } from '@ant-design/icons';
import AILoading from '@/components/AILoading';
import SchemaConfirmation from '@/components/SchemaConfirmation';
import { useSimpleAILoading } from '@/components/AILoading/useAILoading';
import { getSchemaHelp, generateModelDesignPrompt } from '@/AIHelper';
import { getEnums, postEnums } from '@/services/BDC/api/enumManagement';
import type { Field } from '@/components/SchemaValidator/types';

const { Title, Paragraph } = Typography;

interface AIAssistModalProps {
  open: boolean;
  onCancel: () => void;
  selectedSchema: any;
  onFieldOptimize?: (optimizedFields: any[], optimizedIndexes: any) => void;
}

interface OptimizedSchema {
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
  optimizationNotes?: string;
  newEnums?: any[];
}

const AIAssistModal: React.FC<AIAssistModalProps> = ({
  open,
  onCancel,
  selectedSchema,
  onFieldOptimize
}) => {
  const [optimizedSchema, setOptimizedSchema] = useState<OptimizedSchema | null>(null);
  const [modifyInput, setModifyInput] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [senderValue, setSenderValue] = useState('');
  const [senderLoading, setSenderLoading] = useState(false);
  const [existingEnums, setExistingEnums] = useState<any[]>([]);
  const [newEnums, setNewEnums] = useState<any[]>([]);
  const { isVisible: isAILoading, text: aiLoadingText, showLoading, hideLoading } = useSimpleAILoading();

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

  // 监听selectedSchema变化，当切换模型时重置状态
  useEffect(() => {
    if (selectedSchema) {
      // 重置所有状态回到第一步
      setOptimizedSchema(null);
      setModifyInput('');
      setNewEnums([]);
      setSenderValue('');
      setSenderLoading(false);
      setIsModifying(false);
      hideLoading();
    }
  }, [selectedSchema?.id]); // 使用selectedSchema.id作为依赖，确保只有模型真正切换时才重置

  // 监听模态框开关状态，关闭时重置状态
  useEffect(() => {
    if (!open) {
      // 模态框关闭时重置所有状态
      setOptimizedSchema(null);
      setModifyInput('');
      setNewEnums([]);
      setSenderValue('');
      setSenderLoading(false);
      setIsModifying(false);
      hideLoading();
    }
  }, [open]);

  // 处理用户输入提交
  const handleSubmit = async (userMessage: string) => {
    if (!userMessage.trim()) {
      return;
    }

    setSenderLoading(true);
    showLoading('AI 正在分析您的建议...');
    try {
      // 构建 AI 提示词
      const prompt = generateModelDesignPrompt(
        {
          currentModel: selectedSchema,
          userRequirement: userMessage,
          existingEnums
        },
        {
          operationType: 'optimize',
          includeOptimizationNotes: true,
          includeNewEnums: true
        }
      );

      // 调用 AI 服务
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
        message.error('AI 返回的数据格式不正确');
        return;
      }

      // 验证优化后的模型
      if (parsedSchema.fields && Array.isArray(parsedSchema.fields)) {
        // 处理新枚举
        if (parsedSchema.newEnums && Array.isArray(parsedSchema.newEnums)) {
          setNewEnums(parsedSchema.newEnums);
        } else {
          setNewEnums([]);
        }

        setOptimizedSchema(parsedSchema);
        message.success('AI 分析完成！');
      } else {
        message.error('AI 返回的模型格式不正确');
      }
    } catch (error) {
      console.error('AI 分析失败:', error);
      message.error('AI 分析失败，请重试');
    } finally {
      setSenderLoading(false);
      hideLoading();
    }
  };

  // 一键自动优化
  const handleAutoOptimize = async () => {
    if (!selectedSchema) {
      message.error('没有选中的数据模型');
      return;
    }

    showLoading('AI 正在自动优化数据模型...');
    try {
      // 构建自动优化提示词
      const prompt = generateModelDesignPrompt(
        {
          currentModel: selectedSchema,
          existingEnums
        },
        {
          operationType: 'optimize',
          includeOptimizationNotes: true,
          includeNewEnums: true
        }
      );

      // 调用 AI 服务
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
        message.error('AI 返回的数据格式不正确');
        return;
      }

      // 验证优化后的模型
      if (parsedSchema.fields && Array.isArray(parsedSchema.fields)) {
        // 处理新枚举
        if (parsedSchema.newEnums && Array.isArray(parsedSchema.newEnums)) {
          setNewEnums(parsedSchema.newEnums);
        } else {
          setNewEnums([]);
        }

        setOptimizedSchema(parsedSchema);
        message.success('自动优化完成！');
      } else {
        message.error('AI 返回的模型格式不正确');
      }
    } catch (error) {
      console.error('自动优化失败:', error);
      message.error('自动优化失败，请检查网络连接或重试');
    } finally {
      hideLoading();
    }
  };

  // 应用优化结果
  const handleApplyOptimization = async () => {
    if (!optimizedSchema || !onFieldOptimize) {
      message.error('没有可应用的优化结果');
      return;
    }

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

      // 再应用优化结果
      await onFieldOptimize(optimizedSchema.fields, optimizedSchema.keyIndexes);
      message.success('优化结果已应用！');
      onCancel();
    } catch (error) {
      console.error('应用优化结果失败:', error);
      message.error('应用优化结果失败');
    }
  };

  // 重新优化
  const handleReoptimize = () => {
    setOptimizedSchema(null);
    setModifyInput('');
    setNewEnums([]);
  };

  // 修改优化要求
  const handleModify = async () => {
    if (!modifyInput.trim()) {
      message.warning('请输入修改要求');
      return;
    }

    setIsModifying(true);
    setSenderLoading(true);
    showLoading('AI 正在根据新要求重新优化...');
    try {
      const prompt = generateModelDesignPrompt(
        {
          currentModel: selectedSchema,
          userRequirement: modifyInput,
          existingEnums
        },
        {
          operationType: 'optimize',
          includeOptimizationNotes: true,
          includeNewEnums: true
        }
      );

      const aiResponse = await getSchemaHelp(prompt);
      
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
        message.error('AI 返回的数据格式不正确');
        return;
      }

      if (parsedSchema.fields && Array.isArray(parsedSchema.fields)) {
        // 处理新枚举
        if (parsedSchema.newEnums && Array.isArray(parsedSchema.newEnums)) {
          setNewEnums(parsedSchema.newEnums);
        } else {
          setNewEnums([]);
        }

        setOptimizedSchema(parsedSchema);
        setModifyInput('');
        message.success('重新优化完成！');
      } else {
        message.error('AI 返回的模型格式不正确');
      }
    } catch (error) {
      console.error('重新优化失败:', error);
      message.error('重新优化失败，请重试');
    } finally {
      setIsModifying(false);
      setSenderLoading(false);
      hideLoading();
    }
  };



  return (
      <Modal
        title={
          <Space>
            <RobotOutlined />
            <span>AI 协助优化</span>
          </Space>
        }
        open={open}
        onCancel={onCancel}
        footer={null}
        width={800}
        destroyOnClose
      >
        {!optimizedSchema ? (
          // 第一步：输入优化建议
          <div style={{ padding: '20px 0' }}>
            <Title level={4}>第一步：提出优化建议</Title>
            <Paragraph type="secondary">
              当前数据模型：<strong>{selectedSchema?.name}</strong> ({selectedSchema?.code})
            </Paragraph>
            <Paragraph type="secondary">
              您可以提出优化建议，AI 将为您分析并提供改进方案。
            </Paragraph>

            <div style={{ marginBottom: '16px' }}>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleAutoOptimize}
                style={{ width: '100%', marginBottom: '16px' }}
              >
                一键自动优化
              </Button>
            </div>
            <Divider>Or</Divider>
            <div>
              <Sender
                loading={senderLoading}
                value={senderValue}
                onChange={(v) => {
                  setSenderValue(v);
                }}
                onSubmit={(message) => {
                  handleSubmit(message);
                  setSenderValue('');
                }}
                onCancel={() => {
                  setSenderLoading(false);
                  message.info('已取消发送');
                }}
                submitType="shiftEnter"
                autoSize={{ minRows: 3, maxRows: 6 }}
                placeholder="请输入您的优化建议，例如：'这个模型缺少创建时间字段'、'建议添加用户状态字段'等..."
              />
            </div>

            <div style={{ marginTop: '16px', padding: '12px', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>💡 优化建议示例：</h4>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#666' }}>
                <li>建议添加创建时间和更新时间字段</li>
                <li>用户状态字段应该使用枚举类型</li>
                <li>缺少与用户表的关联关系</li>
                <li>字段命名不够规范，建议统一使用下划线命名</li>
                <li>建议为常用查询字段添加索引</li>
              </ul>
            </div>
            <AILoading 
              visible={isAILoading} 
              text={aiLoadingText} 
            />
          </div>
        ) : (
          <SchemaConfirmation
            schema={{
              ...optimizedSchema,
              newEnums
            }}
            stepTitle="第二步：确认优化结果"
            stepDescription="AI 已根据您的建议优化了模型结构，请确认是否符合预期。"
            modifyInput={modifyInput}
            onModifyInputChange={setModifyInput}
            onModify={handleModify}
            onRegenerate={handleReoptimize}
            onConfirm={handleApplyOptimization}
            isModifying={isModifying}
            isRegenerating={false}
            isConfirming={false}
            modifyButtonText="提交修改要求并重新优化"
            regenerateButtonText="重新优化"
            confirmButtonText="应用优化结果"
            showOptimizationNotes={true}
          />
        )}
      </Modal>
  );
};

export default AIAssistModal; 