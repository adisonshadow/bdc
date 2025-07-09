import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Space, Typography, Tabs, Card, List, Tooltip } from 'antd';
import { RobotOutlined, LoadingOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { getSchemaHelp } from '@/AIHelper/aiService';
import { AIError, AIErrorType } from '@/AIHelper/config';
import { generateModelDesignPrompt, generateBatchCreatePrompt } from '@/AIHelper/modelDesignPromptGenerator';
import type { Field } from '@/components/SchemaValidator/types';
import AILoading from '@/components/AILoading';
import SchemaConfirmation from '@/components/SchemaConfirmation';
import { getEnums, postEnums } from '@/services/BDC/api/enumManagement';
import { getSchemas, postSchemas } from '@/services/BDC/api/schemaManagement';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

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
  } | {
    schemas: Array<{
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
    }>;
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

interface GeneratedSchemas {
  schemas: GeneratedSchema[];
}

  // 分批创建相关类型
  interface SchemaInfo {
    name: string;
    code: string;
    description: string;
    priority: number;
    dependencies: string[];
    status: 'pending' | 'creating' | 'created' | 'failed' | 'existing';
    error?: string;
  }

interface BatchCreationState {
  status: 'analyzing' | 'creating' | 'completed' | 'failed';
  currentBatch: number;
  totalBatches: number;
  schemaList: SchemaInfo[];
  createdSchemas: GeneratedSchema[];
  currentBatchSchemas: GeneratedSchema[];
  dependencies: Map<string, string[]>;
}

const AICreateSchema: React.FC<AICreateSchemaProps> = ({
  open,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSchema, setGeneratedSchema] = useState<GeneratedSchema | null>(null);
  const [generatedSchemas, setGeneratedSchemas] = useState<GeneratedSchemas | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [modifyInput, setModifyInput] = useState('');
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [existingEnums, setExistingEnums] = useState<Array<{
    code: string;
    name: string;
    options?: Array<{ value: string; label: string; description?: string; order?: number }>;
  }>>([]);
  const [newEnums, setNewEnums] = useState<Array<{
    code: string;
    name: string;
    description: string;
    options: Array<{ value: string; label: string; description?: string; order?: number }>;
  }>>([]);

  // 分批创建相关状态
  const [batchCreationState, setBatchCreationState] = useState<BatchCreationState>({
    status: 'analyzing',
    currentBatch: 0,
    totalBatches: 0,
    schemaList: [],
    createdSchemas: [],
    currentBatchSchemas: [],
    dependencies: new Map()
  });

  // 已存在的表信息
  const [existingSchemas, setExistingSchemas] = useState<Array<{
    name: string;
    code: string;
    description?: string;
  }>>([]);

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

  // 获取现有枚举列表
  const fetchExistingEnums = async () => {
    try {
      const enums = await getEnums({});
      setExistingEnums(enums);
    } catch (error) {
      console.error('获取枚举列表失败:', error);
    }
  };

  // 获取已存在的表
  const fetchExistingSchemas = async () => {
    try {
      const schemas = await getSchemas({});
      setExistingSchemas(schemas.map((schema: any) => ({
        name: schema.name,
        code: schema.code,
        description: schema.description
      })));
    } catch (error) {
      console.error('获取已存在表列表失败:', error);
    }
  };

  // 组件挂载时获取枚举列表和已存在的表（只在第一次打开时获取）
  useEffect(() => {
    if (open && existingSchemas.length === 0) {
      fetchExistingEnums();
      fetchExistingSchemas();
    }
  }, [open, existingSchemas.length]);

  // 处理字段处理逻辑
  const processFields = (fields: any[]): Field[] => {
    const allNewEnums: any[] = [];
    const processedFields = fields.map((field: any, index: number) => {
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
        numberConfig: field.numberConfig,
        dateConfig: field.dateConfig,
        enumConfig: field.enumConfig,
        relationConfig: field.relationConfig,
        mediaConfig: field.mediaConfig,
        apiConfig: field.apiConfig
      };
    });

    // 更新全局的 newEnums
    if (allNewEnums.length > 0) {
      setNewEnums(prev => [...prev, ...allNewEnums]);
    }

    return processedFields;
  };

  // 生成模型
  const handleGenerate = async () => {
    const values = await form.validateFields();
    
    setIsGenerating(true);
    setIsAILoading(true);
    
    try {
      const prompt = generateModelDesignPrompt(
        {
          userRequirement: values.description,
          existingEnums,
          existingSchemas
        },
        {
          operationType: 'create',
          includeNewEnums: true
        }
      );

      const aiResponse = await getSchemaHelp(prompt);
      
      // 尝试解析 AI 返回的 JSON
      let parsedData;
      try {
        // 首先尝试找到完整的JSON对象
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          
          // 检查JSON是否完整（尝试解析）
          try {
            parsedData = JSON.parse(jsonStr);
          } catch (parseError: any) {
            // 如果JSON不完整，尝试修复常见的截断问题
            console.warn('JSON可能被截断，尝试修复:', parseError);
            
            // 尝试找到最后一个完整的对象或数组
            let fixedJson = jsonStr;
            
            // 如果以逗号结尾，移除它
            if (fixedJson.endsWith(',')) {
              fixedJson = fixedJson.slice(0, -1);
            }
            
            // 如果以不完整的字符串结尾，尝试移除
            if (fixedJson.includes('"') && !fixedJson.endsWith('"')) {
              const lastQuoteIndex = fixedJson.lastIndexOf('"');
              if (lastQuoteIndex > 0) {
                const beforeLastQuote = fixedJson.substring(0, lastQuoteIndex);
                const afterLastQuote = fixedJson.substring(lastQuoteIndex + 1);
                
                // 如果最后一个引号后面还有内容，尝试移除不完整的部分
                if (afterLastQuote.includes('"')) {
                  const nextQuoteIndex = afterLastQuote.indexOf('"');
                  if (nextQuoteIndex > 0) {
                    fixedJson = beforeLastQuote + afterLastQuote.substring(nextQuoteIndex);
                  }
                } else {
                  // 移除不完整的字符串
                  fixedJson = beforeLastQuote;
                }
              }
            }
            
            // 尝试添加缺失的闭合括号
            const openBraces = (fixedJson.match(/\{/g) || []).length;
            const closeBraces = (fixedJson.match(/\}/g) || []).length;
            const openBrackets = (fixedJson.match(/\[/g) || []).length;
            const closeBrackets = (fixedJson.match(/\]/g) || []).length;
            
            if (openBraces > closeBraces) {
              fixedJson += '}'.repeat(openBraces - closeBraces);
            }
            if (openBrackets > closeBrackets) {
              fixedJson += ']'.repeat(openBrackets - closeBrackets);
            }
            
            try {
              parsedData = JSON.parse(fixedJson);
              console.log('JSON修复成功');
            } catch (secondParseError: any) {
              console.error('JSON修复失败:', secondParseError);
              throw new Error(`AI返回的JSON格式不完整，可能是由于响应长度限制。请尝试简化您的需求描述，或者分多次创建模型。\n\n原始错误: ${parseError.message}`);
            }
          }
        } else {
          throw new Error('未找到有效的 JSON 数据');
        }
      } catch (parseError: any) {
        console.error('解析 AI 响应失败:', parseError);
        message.error(parseError.message || 'AI 返回的数据格式不正确，请重试');
        return;
      }

      // 重置 newEnums
      setNewEnums([]);

      // 判断响应类型
      if (parsedData.type === 'batch_plan') {
        // 分批创建模式
        const schemaList: SchemaInfo[] = parsedData.schemaList.map((schema: any) => ({
          ...schema,
          status: 'pending' as const
        }));

        // 检查并标记已存在的表（检查code和name，支持命名空间匹配）
        const updatedSchemaList = schemaList.map(schema => {
          // 调试信息
          console.log('检查模型是否存在:', {
            schemaName: schema.name,
            schemaCode: schema.code,
            existingSchemas: existingSchemas.map(e => ({ name: e.name, code: e.code }))
          });
          
          // 检查是否已存在
          const isExisting = existingSchemas.some(existing => {
            // 检查name是否匹配
            if (existing.name === schema.name) {
              console.log('通过name匹配到已存在:', existing.name);
              return true;
            }
            // 检查code是否完全匹配
            if (existing.code === schema.code) {
              console.log('通过code完全匹配到已存在:', existing.code);
              return true;
            }
            // 检查code的后缀部分是否匹配（处理命名空间情况）
            if (existing.code.includes(':') && existing.code.split(':').pop() === schema.code) {
              console.log('通过命名空间后缀匹配到已存在:', existing.code, '->', schema.code);
              return true;
            }
            if (schema.code.includes(':') && schema.code.split(':').pop() === existing.code) {
              console.log('通过schema命名空间后缀匹配到已存在:', schema.code, '->', existing.code);
              return true;
            }
            
            // 检查code的任意部分是否匹配（更宽松的匹配）
            const existingCodeParts = existing.code.split(':');
            const schemaCodeParts = schema.code.split(':');
            
            // 检查是否有共同的code部分
            const commonParts = existingCodeParts.filter(part => 
              schemaCodeParts.includes(part)
            );
            if (commonParts.length > 0) {
              console.log('通过共同code部分匹配到已存在:', existing.code, '->', schema.code, '共同部分:', commonParts);
              return true;
            }
            
            // 检查name是否包含在code中或code是否包含name
            if (existing.code.toLowerCase().includes(schema.name.toLowerCase()) || 
                schema.code.toLowerCase().includes(existing.name.toLowerCase())) {
              console.log('通过name在code中的匹配到已存在:', existing.code, '->', schema.code);
              return true;
            }
            
            return false;
          });
          
          if (isExisting) {
            const existingSchema = existingSchemas.find(existing => 
              existing.name === schema.name || 
              existing.code === schema.code ||
              (existing.code.includes(':') && existing.code.split(':').pop() === schema.code) ||
              (schema.code.includes(':') && schema.code.split(':').pop() === existing.code)
            );
            const reason = existingSchema?.code === schema.code ? '该代码的数据结构已存在' : '该名称的数据结构已存在';
            return { ...schema, status: 'existing' as const, error: reason };
          }
          return schema;
        });

        // 计算需要创建的模型数量（排除已存在的）
        const schemasToCreate = updatedSchemaList.filter(s => s.status === 'pending');
        const totalBatches = Math.ceil(schemasToCreate.length / 2);

        // 显示已存在模型的信息
        const existingModels = updatedSchemaList.filter(s => s.status === 'existing');
        if (existingModels.length > 0) {
          message.info(`发现 ${existingModels.length} 个已存在的模型：${existingModels.map(s => s.name).join(', ')}`);
        }

        setBatchCreationState({
          status: 'creating',
          currentBatch: 0,
          totalBatches,
          schemaList: updatedSchemaList,
          createdSchemas: [],
          currentBatchSchemas: [],
          dependencies: new Map(updatedSchemaList.map(s => [s.code, s.dependencies]))
        });

        // 开始第一批创建
        await startNextBatch();
      } else if (parsedData.type === 'direct' || parsedData.schemas) {
        // 直接创建模式（≤2个模型）
        const processedSchemas = parsedData.schemas.map((schema: any) => {
          const processedFields = processFields(schema.fields);
          return {
            name: schema.name,
            code: schema.code,
            description: schema.description || values.description,
            fields: processedFields,
            keyIndexes: schema.keyIndexes || {
              primaryKey: ['id'],
              indexes: []
            }
          };
        });

        // 处理全局的 newEnums
        if (parsedData.newEnums && Array.isArray(parsedData.newEnums)) {
          setNewEnums(parsedData.newEnums);
        }

        setGeneratedSchemas({ schemas: processedSchemas });
        setGeneratedSchema(null);
        message.success(`成功生成 ${processedSchemas.length} 个模型！`);
      } else if (parsedData.name && parsedData.code && parsedData.fields && Array.isArray(parsedData.fields)) {
        // 单个模型
        const processedFields = processFields(parsedData.fields);

        const schema: GeneratedSchema = {
          name: parsedData.name,
          code: parsedData.code,
          description: parsedData.description || values.description,
          fields: processedFields,
          keyIndexes: parsedData.keyIndexes || {
            primaryKey: ['id'],
            indexes: []
          }
        };

        // 处理全局的 newEnums
        if (parsedData.newEnums && Array.isArray(parsedData.newEnums)) {
          setNewEnums(parsedData.newEnums);
        }

        setGeneratedSchema(schema);
        setGeneratedSchemas(null);
        message.success('模型生成成功！');
      } else {
        message.error('AI 生成的模型格式不正确');
      }
    } catch (error) {
      console.error('生成模型失败:', error);
      handleAIError(error);
    } finally {
      setIsGenerating(false);
      setIsAILoading(false);
    }
  };

  // 开始下一批创建
  const startNextBatch = async () => {
    setBatchCreationState(prevState => {
      const { schemaList, createdSchemas, dependencies } = prevState;
      
      // 获取可创建的模型（依赖已满足的，且不是已存在的）
      const availableSchemas = schemaList.filter(schema => {
        if (schema.status !== 'pending') return false;
        // 检查是否已存在（检查code和name，支持命名空间匹配）
        const isExisting = existingSchemas.some(existing => {
          // 检查name是否匹配
          if (existing.name === schema.name) return true;
          // 检查code是否完全匹配
          if (existing.code === schema.code) return true;
          // 检查code的后缀部分是否匹配（处理命名空间情况）
          if (existing.code.includes(':') && existing.code.split(':').pop() === schema.code) return true;
          if (schema.code.includes(':') && schema.code.split(':').pop() === existing.code) return true;
          
          // 检查code的任意部分是否匹配（更宽松的匹配）
          const existingCodeParts = existing.code.split(':');
          const schemaCodeParts = schema.code.split(':');
          
          // 检查是否有共同的code部分
          const commonParts = existingCodeParts.filter(part => 
            schemaCodeParts.includes(part)
          );
          if (commonParts.length > 0) return true;
          
          // 检查name是否包含在code中或code是否包含name
          if (existing.code.toLowerCase().includes(schema.name.toLowerCase()) || 
              schema.code.toLowerCase().includes(existing.name.toLowerCase())) {
            return true;
          }
          
          return false;
        });
        if (isExisting) {
          // 标记为已存在
          const updatedSchemaList = schemaList.map(s =>
            s.code === schema.code 
              ? { 
                  ...s, 
                  status: 'existing' as const, 
                  error: existingSchemas.some(existing => existing.code === schema.code) 
                    ? '该代码的数据结构已存在' 
                    : '该名称的数据结构已存在'
                }
              : s
          );
          // 递归调用，跳过已存在的模型
          setTimeout(() => {
            setBatchCreationState(currentState => {
              const newAvailableSchemas = currentState.schemaList.filter(s => {
                if (s.status !== 'pending') return false;
                const isExisting = existingSchemas.some(existing => {
                  // 检查name是否匹配
                  if (existing.name === s.name) return true;
                  // 检查code是否完全匹配
                  if (existing.code === s.code) return true;
                  // 检查code的后缀部分是否匹配（处理命名空间情况）
                  if (existing.code.includes(':') && existing.code.split(':').pop() === s.code) return true;
                  if (s.code.includes(':') && s.code.split(':').pop() === existing.code) return true;
                  
                  // 检查code的任意部分是否匹配（更宽松的匹配）
                  const existingCodeParts = existing.code.split(':');
                  const schemaCodeParts = s.code.split(':');
                  
                  // 检查是否有共同的code部分
                  const commonParts = existingCodeParts.filter(part => 
                    schemaCodeParts.includes(part)
                  );
                  if (commonParts.length > 0) return true;
                  
                  // 检查name是否包含在code中或code是否包含name
                  if (existing.code.toLowerCase().includes(s.name.toLowerCase()) || 
                      s.code.toLowerCase().includes(existing.name.toLowerCase())) {
                    return true;
                  }
                  
                  return false;
                });
                if (isExisting) {
                  // 标记为已存在
                  const updatedList = currentState.schemaList.map(schema =>
                    schema.code === s.code 
                      ? { 
                          ...schema, 
                          status: 'existing' as const, 
                          error: existingSchemas.some(existing => existing.code === s.code) 
                            ? '该代码的数据结构已存在' 
                            : '该名称的数据结构已存在'
                        }
                      : schema
                  );
                  return { ...currentState, schemaList: updatedList };
                }
                // 检查依赖关系，但允许跳过已存在或失败的依赖
                return s.dependencies.every(dep => {
                  // 检查依赖是否已创建成功
                  const isCreated = currentState.createdSchemas.some(created => created.code === dep);
                  if (isCreated) return true;
                  
                  // 检查依赖是否已存在
                  const isExisting = existingSchemas.some(existing => {
                    if (existing.name === dep) return true;
                    if (existing.code === dep) return true;
                    if (existing.code.includes(':') && existing.code.split(':').pop() === dep) return true;
                    if (dep.includes(':') && dep.split(':').pop() === existing.code) return true;
                    
                    // 检查code的任意部分是否匹配（更宽松的匹配）
                    const existingCodeParts = existing.code.split(':');
                    const depCodeParts = dep.split(':');
                    
                    // 检查是否有共同的code部分
                    const commonParts = existingCodeParts.filter(part => 
                      depCodeParts.includes(part)
                    );
                    if (commonParts.length > 0) return true;
                    
                    // 检查name是否包含在code中或code是否包含name
                    if (existing.code.toLowerCase().includes(dep.toLowerCase()) || 
                        dep.toLowerCase().includes(existing.name.toLowerCase())) {
                      return true;
                    }
                    
                    return false;
                  });
                  if (isExisting) return true;
                  
                  // 检查依赖是否已失败（如果是失败的依赖，我们也跳过）
                  const isFailed = currentState.schemaList.some(schema => 
                    schema.code === dep && schema.status === 'failed'
                  );
                  if (isFailed) return true;
                  
                  return false;
                });
              });
              
              if (newAvailableSchemas.length === 0) {
                // 检查是否所有模型都已处理完成
                const allProcessed = currentState.schemaList.every(s => 
                  s.status === 'created' || s.status === 'existing' || s.status === 'failed'
                );
                if (allProcessed) {
                  return { ...currentState, status: 'completed' };
                } else {
                  // 有模型无法创建（依赖问题）
                  const pendingSchemas = currentState.schemaList.filter(s => s.status === 'pending');
                  const failedSchemas = currentState.schemaList.filter(s => s.status === 'failed');
                  
                  let errorMessage = `以下模型无法创建，请检查依赖关系：${pendingSchemas.map(s => s.name).join(', ')}`;
                  
                  if (failedSchemas.length > 0) {
                    errorMessage += `\n\n失败的模型：${failedSchemas.map(s => s.name).join(', ')}`;
                    errorMessage += '\n\n建议：';
                    errorMessage += '\n1. 先重试失败的模型';
                    errorMessage += '\n2. 或者点击"继续创建"跳过依赖失败的模型';
                  }
                  
                  message.error(errorMessage);
                  return { ...currentState, status: 'failed' };
                }
              }

              // 选择当前批次的模型（最多2个）
              const currentBatchSchemas = newAvailableSchemas
                .sort((a, b) => a.priority - b.priority)
                .slice(0, 2);

              // 标记当前批次模型为创建中
              const updatedSchemaList = currentState.schemaList.map(schema => 
                currentBatchSchemas.some(cs => cs.code === schema.code)
                  ? { ...schema, status: 'creating' as const }
                  : schema
              );

              // 更新状态并开始创建
              const newState = {
                ...currentState,
                currentBatch: currentState.currentBatch + 1,
                schemaList: updatedSchemaList
              };

              // 异步开始创建过程
              setTimeout(() => {
                createCurrentBatch(currentBatchSchemas, newState);
              }, 100);

              return newState;
            });
          }, 100);
          return prevState;
        }
        // 检查依赖关系，但允许跳过已存在或失败的依赖
        return schema.dependencies.every(dep => {
          // 检查依赖是否已创建成功
          const isCreated = createdSchemas.some(created => created.code === dep);
          if (isCreated) return true;
          
          // 检查依赖是否已存在
          const isExisting = existingSchemas.some(existing => {
            if (existing.name === dep) return true;
            if (existing.code === dep) return true;
            if (existing.code.includes(':') && existing.code.split(':').pop() === dep) return true;
            if (dep.includes(':') && dep.split(':').pop() === existing.code) return true;
            
            // 检查code的任意部分是否匹配（更宽松的匹配）
            const existingCodeParts = existing.code.split(':');
            const depCodeParts = dep.split(':');
            
            // 检查是否有共同的code部分
            const commonParts = existingCodeParts.filter(part => 
              depCodeParts.includes(part)
            );
            if (commonParts.length > 0) return true;
            
            // 检查name是否包含在code中或code是否包含name
            if (existing.code.toLowerCase().includes(dep.toLowerCase()) || 
                dep.toLowerCase().includes(existing.name.toLowerCase())) {
              return true;
            }
            
            return false;
          });
          if (isExisting) return true;
          
          // 检查依赖是否已失败（如果是失败的依赖，我们也跳过）
          const isFailed = schemaList.some(s => 
            s.code === dep && s.status === 'failed'
          );
          if (isFailed) return true;
          
          return false;
        });
      });

      if (availableSchemas.length === 0) {
        // 没有可创建的模型，检查是否所有模型都已处理完成
        const allProcessed = schemaList.every(s => 
          s.status === 'created' || s.status === 'existing' || s.status === 'failed'
        );
        if (allProcessed) {
          return { ...prevState, status: 'completed' };
        } else {
          // 有模型无法创建（依赖问题）
          const pendingSchemas = schemaList.filter(s => s.status === 'pending');
          const failedSchemas = schemaList.filter(s => s.status === 'failed');
          
          let errorMessage = `以下模型无法创建，请检查依赖关系：${pendingSchemas.map(s => s.name).join(', ')}`;
          
          if (failedSchemas.length > 0) {
            errorMessage += `\n\n失败的模型：${failedSchemas.map(s => s.name).join(', ')}`;
            errorMessage += '\n\n建议：';
            errorMessage += '\n1. 先重试失败的模型';
            errorMessage += '\n2. 或者点击"继续创建"跳过依赖失败的模型';
          }
          
          message.error(errorMessage);
          return { ...prevState, status: 'failed' };
        }
      }

      // 选择当前批次的模型（最多2个）
      const currentBatchSchemas = availableSchemas
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 2);

      // 标记当前批次模型为创建中
      const updatedSchemaList = schemaList.map(schema => 
        currentBatchSchemas.some(cs => cs.code === schema.code)
          ? { ...schema, status: 'creating' as const }
          : schema
      );

      // 更新状态并开始创建
      const newState = {
        ...prevState,
        currentBatch: prevState.currentBatch + 1,
        schemaList: updatedSchemaList
      };

      // 异步开始创建过程
      setTimeout(() => {
        createCurrentBatch(currentBatchSchemas, newState);
      }, 100);

      return newState;
    });
  };

  // 创建当前批次
  const createCurrentBatch = async (currentBatchSchemas: SchemaInfo[], currentState: BatchCreationState) => {
    try {
      // 过滤掉已存在的表，只创建真正需要创建的表（检查code和name，支持命名空间匹配）
      const schemasToCreate = currentBatchSchemas.filter(schema => {
        const isExisting = existingSchemas.some(existing => {
          // 检查name是否匹配
          if (existing.name === schema.name) return true;
          // 检查code是否完全匹配
          if (existing.code === schema.code) return true;
          // 检查code的后缀部分是否匹配（处理命名空间情况）
          if (existing.code.includes(':') && existing.code.split(':').pop() === schema.code) return true;
          if (schema.code.includes(':') && schema.code.split(':').pop() === existing.code) return true;
          
          // 检查code的任意部分是否匹配（更宽松的匹配）
          const existingCodeParts = existing.code.split(':');
          const schemaCodeParts = schema.code.split(':');
          
          // 检查是否有共同的code部分
          const commonParts = existingCodeParts.filter(part => 
            schemaCodeParts.includes(part)
          );
          if (commonParts.length > 0) return true;
          
          // 检查name是否包含在code中或code是否包含name
          if (existing.code.toLowerCase().includes(schema.name.toLowerCase()) || 
              schema.code.toLowerCase().includes(existing.name.toLowerCase())) {
            return true;
          }
          
          return false;
        });
        if (isExisting) {
          // 标记为已存在
          setBatchCreationState(prevState => {
            const updatedSchemaList = prevState.schemaList.map(s =>
              s.code === schema.code 
                ? { 
                    ...s, 
                    status: 'existing' as const, 
                    error: existingSchemas.some(existing => existing.code === schema.code) 
                      ? '该代码的数据结构已存在' 
                      : '该名称的数据结构已存在'
                  }
                : s
            );
            return { ...prevState, schemaList: updatedSchemaList };
          });
          return false;
        }
        return true;
      });

      // 如果没有需要创建的表，直接进入下一批
      if (schemasToCreate.length === 0) {
        setTimeout(() => startNextBatch(), 1000);
        return;
      }

      // 生成当前批次的模型结构
      const prompt = generateBatchCreatePrompt({
        schemaList: currentState.schemaList,
        currentBatchSchemas: schemasToCreate.map(s => ({
          name: s.name,
          code: s.code,
          description: s.description
        })),
        createdSchemas: currentState.createdSchemas,
        existingEnums,
        existingSchemas
      });

      const aiResponse = await getSchemaHelp(prompt);
      
      // 解析AI响应
      let parsedData;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('未找到有效的 JSON 数据');
        }
      } catch (parseError: any) {
        console.error('解析 AI 响应失败:', parseError);
        message.error('AI 返回的数据格式不正确，请重试');
        return;
      }

      // 处理生成的模型
      const processedSchemas = parsedData.schemas.map((schema: any) => {
        const processedFields = processFields(schema.fields);
        return {
          name: schema.name,
          code: schema.code,
          description: schema.description,
          fields: processedFields,
          keyIndexes: schema.keyIndexes || {
            primaryKey: ['id'],
            indexes: []
          }
        };
      });

      // 处理新枚举
      if (parsedData.newEnums && Array.isArray(parsedData.newEnums)) {
        setNewEnums(prev => [...prev, ...parsedData.newEnums]);
      }

      // 创建模型
      let response;
      try {
        response = await postSchemas(processedSchemas);
      } catch (error: any) {
        // 处理批量创建API的错误响应
        if (error?.response?.data && typeof error.response.data === 'object' && 'results' in error.response.data) {
          // 这是批量创建API的错误响应，包含详细结果
          const batchResponse = error.response.data;
          const results = batchResponse.results || [];
          const successfulSchemas: GeneratedSchema[] = [];
          const failedSchemas: Array<{code: string, error: string}> = [];
          const existingSchemas: Array<{code: string, name: string}> = [];

          results.forEach((result: any) => {
            if (result.success) {
              // 创建成功的模型
              const schema = processedSchemas.find((s: GeneratedSchema) => s.code === result.code);
              if (schema) {
                successfulSchemas.push(schema);
              }
            } else {
              // 检查是否是已存在的表
              if (result.error && (result.error.includes('已存在') || result.error.includes('代码') || result.error.includes('名称'))) {
                existingSchemas.push({
                  code: result.code,
                  name: result.name
                });
              } else {
                // 其他错误
                failedSchemas.push({
                  code: result.code,
                  error: result.error
                });
              }
            }
          });

          // 更新状态
          setBatchCreationState(prevState => {
            const updatedCreatedSchemas = [...prevState.createdSchemas, ...successfulSchemas];
            const updatedSchemaList = prevState.schemaList.map(schema => {
              if (schemasToCreate.some(cs => cs.code === schema.code)) {
                if (successfulSchemas.some(s => s.code === schema.code)) {
                  return { ...schema, status: 'created' as const };
                } else if (existingSchemas.some(s => s.code === schema.code)) {
                  return { ...schema, status: 'existing' as const, error: '该名称的数据结构已存在' };
                } else {
                  const failedSchema = failedSchemas.find(f => f.code === schema.code);
                  return { ...schema, status: 'failed' as const, error: failedSchema?.error || '创建失败' };
                }
              }
              return schema;
            });

            const newState = {
              ...prevState,
              createdSchemas: updatedCreatedSchemas,
              schemaList: updatedSchemaList,
              currentBatchSchemas: successfulSchemas
            };

            // 显示结果消息
            const successCount = successfulSchemas.length;
            const existingCount = existingSchemas.length;
            const failedCount = failedSchemas.length;

            if (successCount > 0) {
              message.success(`第 ${prevState.currentBatch} 批模型创建成功：${successCount} 个成功`);
            }
            if (existingCount > 0) {
              message.info(`发现 ${existingCount} 个已存在的模型：${existingSchemas.map(s => s.name).join(', ')}`);
            }
            if (failedCount > 0) {
              message.warning(`${failedCount} 个模型创建失败`);
            }

            // 检查是否还有未创建的模型
            const remainingSchemas = updatedSchemaList.filter(s => s.status === 'pending');
            if (remainingSchemas.length > 0) {
              // 继续下一批
              setTimeout(() => startNextBatch(), 1000);
            } else {
              // 所有模型处理完成
              const allCompleted = updatedSchemaList.every(s => 
                s.status === 'created' || s.status === 'existing' || s.status === 'failed'
              );
              if (allCompleted) {
                newState.status = 'completed';
                message.success('所有模型处理完成！');
                // 通知父组件刷新数据
                if (updatedCreatedSchemas.length > 0) {
                  onSuccess({
                    schemas: updatedCreatedSchemas
                  });
                }
              }
            }

            return newState;
          });
          return; // 已经处理了错误，不需要继续执行
        } else {
          // 其他类型的错误，抛出异常让下面的catch块处理
          throw error;
        }
      }
      
      // 处理批量创建响应
      if (response && typeof response === 'object' && 'results' in response) {
        // 批量创建响应，需要处理每个模型的结果
        const results = response.results || [];
        const successfulSchemas: GeneratedSchema[] = [];
        const failedSchemas: Array<{code: string, error: string}> = [];
        const existingSchemas: Array<{code: string, name: string}> = [];

        results.forEach((result: any) => {
          if (result.success) {
            // 创建成功的模型
            // 从 result.data 中获取 code，如果没有则从 result 中获取
            const resultCode = result.data?.code || result.code;
            const schema = processedSchemas.find((s: GeneratedSchema) => s.code === resultCode);
            if (schema) {
              successfulSchemas.push(schema);
            }
          } else {
            // 检查是否是已存在的表
            if (result.error && (result.error.includes('已存在') || result.error.includes('代码') || result.error.includes('名称'))) {
              existingSchemas.push({
                code: result.data?.code || result.code,
                name: result.data?.name || result.name
              });
            } else {
              // 其他错误
              failedSchemas.push({
                code: result.data?.code || result.code,
                error: result.error
              });
            }
          }
        });

        // 更新状态
        setBatchCreationState(prevState => {
          const updatedCreatedSchemas = [...prevState.createdSchemas, ...successfulSchemas];
          const updatedSchemaList = prevState.schemaList.map(schema => {
            if (schemasToCreate.some(cs => cs.code === schema.code)) {
              if (successfulSchemas.some(s => s.code === schema.code)) {
                return { ...schema, status: 'created' as const };
              } else if (existingSchemas.some(s => s.code === schema.code)) {
                return { ...schema, status: 'existing' as const, error: '该名称的数据结构已存在' };
              } else {
                const failedSchema = failedSchemas.find(f => f.code === schema.code);
                return { ...schema, status: 'failed' as const, error: failedSchema?.error || '创建失败' };
              }
            }
            return schema;
          });

          const newState = {
            ...prevState,
            createdSchemas: updatedCreatedSchemas,
            schemaList: updatedSchemaList,
            currentBatchSchemas: successfulSchemas
          };

          // 显示结果消息
          const successCount = successfulSchemas.length;
          const existingCount = existingSchemas.length;
          const failedCount = failedSchemas.length;

          if (successCount > 0) {
            message.success(`第 ${prevState.currentBatch} 批模型创建成功：${successCount} 个成功`);
          }
          if (existingCount > 0) {
            message.info(`发现 ${existingCount} 个已存在的模型：${existingSchemas.map(s => s.name).join(', ')}`);
          }
          if (failedCount > 0) {
            message.warning(`${failedCount} 个模型创建失败`);
          }

          // 检查是否还有未创建的模型
          const remainingSchemas = updatedSchemaList.filter(s => s.status === 'pending');
          if (remainingSchemas.length > 0) {
            // 继续下一批
            setTimeout(() => startNextBatch(), 1000);
          } else {
            // 所有模型处理完成
            const allCompleted = updatedSchemaList.every(s => 
              s.status === 'created' || s.status === 'existing' || s.status === 'failed'
            );
            if (allCompleted) {
              newState.status = 'completed';
              message.success('所有模型处理完成！');
              // 通知父组件刷新数据
              // 无论是否有成功创建的模型，都通知父组件刷新数据
              // 因为可能有些模型已存在，但父组件仍需要刷新以显示最新状态
              onSuccess({
                schemas: updatedCreatedSchemas
              });
            }
          }

          return newState;
        });
      } else {
        // 单个创建响应（兼容旧格式）
        setBatchCreationState(prevState => {
          const updatedCreatedSchemas = [...prevState.createdSchemas, ...processedSchemas];
          const updatedSchemaList = prevState.schemaList.map(schema => 
            schemasToCreate.some((cs: SchemaInfo) => cs.code === schema.code)
              ? { ...schema, status: 'created' as const }
              : schema
          );

          const newState = {
            ...prevState,
            createdSchemas: updatedCreatedSchemas,
            schemaList: updatedSchemaList,
            currentBatchSchemas: processedSchemas
          };

          message.success(`第 ${prevState.currentBatch} 批模型创建成功！`);

          // 检查是否还有未创建的模型
          const remainingSchemas = updatedSchemaList.filter(s => s.status === 'pending');
          if (remainingSchemas.length > 0) {
            // 继续下一批
            setTimeout(() => startNextBatch(), 1000);
          } else {
            // 所有模型创建完成
            message.success('所有模型创建完成！');
            // 通知父组件刷新数据
            // 无论是否有成功创建的模型，都通知父组件刷新数据
            onSuccess({
              schemas: updatedCreatedSchemas
            });
          }

          return newState;
        });
      }

    } catch (error: any) {
      console.error('创建模型失败:', error);
      
      // 标记失败的模型，但不停止整个流程
      setBatchCreationState(prevState => {
        const updatedSchemaList = prevState.schemaList.map(schema => 
          currentBatchSchemas.some((cs: SchemaInfo) => cs.code === schema.code)
            ? { ...schema, status: 'failed' as const, error: error.message }
            : schema
        );

        const newState = {
          ...prevState,
          schemaList: updatedSchemaList
        };

        message.error(`第 ${currentState.currentBatch} 批模型创建失败：${error.message}`);

        // 检查是否还有未创建的模型，如果有则继续下一批
        const remainingSchemas = updatedSchemaList.filter(s => s.status === 'pending');
        if (remainingSchemas.length > 0) {
          // 继续下一批
          setTimeout(() => startNextBatch(), 1000);
        } else {
          // 所有模型都已处理完成（成功或失败）
          const allCreated = updatedSchemaList.every(s => s.status === 'created');
          if (allCreated) {
            newState.status = 'completed';
            // 通知父组件刷新数据
            const createdSchemas = updatedSchemaList
              .filter(s => s.status === 'created')
              .map(s => prevState.createdSchemas.find(cs => cs.code === s.code))
              .filter((schema): schema is GeneratedSchema => schema !== undefined);
            // 无论是否有成功创建的模型，都通知父组件刷新数据
            onSuccess({
              schemas: createdSchemas
            });
          } else {
            newState.status = 'failed';
          }
        }

        return newState;
      });
    }
  };

  // 确认创建
  const handleConfirm = async () => {
    if (!generatedSchema && !generatedSchemas) return;
    
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
      if (generatedSchema) {
        // 单个模型
        await onSuccess({
          name: generatedSchema.name,
          code: generatedSchema.code,
          description: generatedSchema.description,
          fields: generatedSchema.fields,
          keyIndexes: generatedSchema.keyIndexes
        });
      } else if (generatedSchemas) {
        // 多个模型
        await onSuccess({
          schemas: generatedSchemas.schemas
        });
      }
      
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
    setGeneratedSchemas(null);
    handleGenerate();
  };

  // 修改模型
  const handleModify = async () => {
    if (!modifyInput.trim() || (!generatedSchema && !generatedSchemas)) return;
    
    setIsModifying(true);
    setIsAILoading(true);
    
    try {
      const currentModel = generatedSchema || (generatedSchemas?.schemas[0] || null);
      
      const prompt = generateModelDesignPrompt(
        {
          currentModel: currentModel || undefined,
          modifyRequirement: modifyInput,
          existingEnums
        },
        {
          operationType: 'modify'
        }
      );

      const aiResponse = await getSchemaHelp(prompt);
      
      // 尝试解析 AI 返回的 JSON
      let parsedData;
      try {
        // 首先尝试找到完整的JSON对象
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          
          // 检查JSON是否完整（尝试解析）
          try {
            parsedData = JSON.parse(jsonStr);
          } catch (parseError: any) {
            // 如果JSON不完整，尝试修复常见的截断问题
            console.warn('JSON可能被截断，尝试修复:', parseError);
            
            // 尝试找到最后一个完整的对象或数组
            let fixedJson = jsonStr;
            
            // 如果以逗号结尾，移除它
            if (fixedJson.endsWith(',')) {
              fixedJson = fixedJson.slice(0, -1);
            }
            
            // 如果以不完整的字符串结尾，尝试移除
            if (fixedJson.includes('"') && !fixedJson.endsWith('"')) {
              const lastQuoteIndex = fixedJson.lastIndexOf('"');
              if (lastQuoteIndex > 0) {
                const beforeLastQuote = fixedJson.substring(0, lastQuoteIndex);
                const afterLastQuote = fixedJson.substring(lastQuoteIndex + 1);
                
                // 如果最后一个引号后面还有内容，尝试移除不完整的部分
                if (afterLastQuote.includes('"')) {
                  const nextQuoteIndex = afterLastQuote.indexOf('"');
                  if (nextQuoteIndex > 0) {
                    fixedJson = beforeLastQuote + afterLastQuote.substring(nextQuoteIndex);
                  }
                } else {
                  // 移除不完整的字符串
                  fixedJson = beforeLastQuote;
                }
              }
            }
            
            // 尝试添加缺失的闭合括号
            const openBraces = (fixedJson.match(/\{/g) || []).length;
            const closeBraces = (fixedJson.match(/\}/g) || []).length;
            const openBrackets = (fixedJson.match(/\[/g) || []).length;
            const closeBrackets = (fixedJson.match(/\]/g) || []).length;
            
            if (openBraces > closeBraces) {
              fixedJson += '}'.repeat(openBraces - closeBraces);
            }
            if (openBrackets > closeBrackets) {
              fixedJson += ']'.repeat(openBrackets - closeBrackets);
            }
            
            try {
              parsedData = JSON.parse(fixedJson);
              console.log('JSON修复成功');
            } catch (secondParseError: any) {
              console.error('JSON修复失败:', secondParseError);
              throw new Error(`AI返回的JSON格式不完整，可能是由于响应长度限制。请尝试简化您的需求描述，或者分多次创建模型。\n\n原始错误: ${parseError.message}`);
            }
          }
        } else {
          throw new Error('未找到有效的 JSON 数据');
        }
      } catch (parseError: any) {
        console.error('解析 AI 响应失败:', parseError);
        message.error(parseError.message || 'AI 返回的数据格式不正确，请重试');
        return;
      }

      // 重置 newEnums
      setNewEnums([]);

      // 判断是单个模型还是多个模型
      if (parsedData.schemas && Array.isArray(parsedData.schemas)) {
        // 多个模型
        const processedSchemas = parsedData.schemas.map((schema: any) => {
          const processedFields = processFields(schema.fields);
          return {
            name: schema.name,
            code: schema.code,
            description: schema.description || (generatedSchema?.description || generatedSchemas?.schemas[0]?.description),
            fields: processedFields,
            keyIndexes: schema.keyIndexes || {
              primaryKey: ['id'],
              indexes: []
            }
          };
        });

        // 处理全局的 newEnums
        if (parsedData.newEnums && Array.isArray(parsedData.newEnums)) {
          setNewEnums(parsedData.newEnums);
        }

        setGeneratedSchemas({ schemas: processedSchemas });
        setGeneratedSchema(null);
        message.success(`成功修改 ${processedSchemas.length} 个模型！`);
      } else if (parsedData.name && parsedData.code && parsedData.fields && Array.isArray(parsedData.fields)) {
        // 单个模型
        const processedFields = processFields(parsedData.fields);

        const schema: GeneratedSchema = {
          name: parsedData.name,
          code: parsedData.code,
          description: parsedData.description || (generatedSchema?.description || generatedSchemas?.schemas[0]?.description),
          fields: processedFields,
          keyIndexes: parsedData.keyIndexes || {
            primaryKey: ['id'],
            indexes: []
          }
        };

        // 处理全局的 newEnums
        if (parsedData.newEnums && Array.isArray(parsedData.newEnums)) {
          setNewEnums(parsedData.newEnums);
        }

        setGeneratedSchema(schema);
        setGeneratedSchemas(null);
        message.success('模型修改成功！');
      } else {
        message.error('AI 生成的模型格式不正确');
      }

      setModifyInput('');
      setShowModifyDialog(false);
    } catch (error) {
      console.error('修改模型失败:', error);
      handleAIError(error);
    } finally {
      setIsModifying(false);
      setIsAILoading(false);
    }
  };

  // 取消
  const handleCancel = () => {
    form.resetFields();
    setGeneratedSchema(null);
    setGeneratedSchemas(null);
    setNewEnums([]);
    setModifyInput('');
    setShowModifyDialog(false);
    setBatchCreationState({
      status: 'analyzing',
      currentBatch: 0,
      totalBatches: 0,
      schemaList: [],
      createdSchemas: [],
      currentBatchSchemas: [],
      dependencies: new Map()
    });
    onCancel();
  };

  // 渲染多个模型的确认界面
  const renderMultipleSchemasConfirmation = () => {
    if (!generatedSchemas) return null;

    const items = generatedSchemas.schemas.map((schema, index) => ({
      key: index.toString(),
      label: `${schema.code.split(':').pop()} (${schema.name})`,
      children: (
        <SchemaConfirmation
          schema={{
            ...schema,
            newEnums: index === 0 ? newEnums : [] // 只在第一个标签页显示新枚举
          }}
          stepTitle={`模型 ${index + 1}：${schema.name}`}
          stepDescription={`AI 已根据你的需求生成了第 ${index + 1} 个模型结构，请确认是否符合预期。`}
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
          confirmButtonText="确认创建所有模型"
          showOptimizationNotes={false}
        />
      )
    }));

    return (
      <div style={{ padding: '20px 0' }}>
        <Title level={4}>第二步：确认生成的模型</Title>
        <Paragraph type="secondary">
          AI 已根据你的需求生成了 {generatedSchemas.schemas.length} 个模型结构，请确认是否符合预期。
        </Paragraph>

        <Tabs 
          items={items} 
          defaultActiveKey="0"
          type="card"
          size="large"
        />

        {/* 修改要求输入 - 在标签页外部 */}
        {setModifyInput && handleModify && (
          <div style={{ marginTop: 24 }}>
            <Card title="对模型有进一步要求？" style={{ marginBottom: 16 }}>
              <TextArea
                value={modifyInput}
                onChange={e => setModifyInput(e.target.value)}
                autoSize={{ minRows: 3, maxRows: 6 }}
                placeholder="如：增加一个唯一索引，添加手机号字段，主键改为自增长ID等"
                disabled={isModifying}
              />
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <Button
                  type="primary"
                  loading={isModifying}
                  disabled={!modifyInput.trim()}
                  onClick={handleModify}
                >
                  提交修改要求并重新生成
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* 操作按钮 - 在标签页外部 */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Space size="large">
            <Button
              type="default"
              loading={isGenerating}
              onClick={handleRegenerate}
            >
              重新生成
            </Button>
            <Button
              type="primary"
              loading={isConfirming}
              onClick={handleConfirm}
            >
              确认创建所有模型
            </Button>
          </Space>
        </div>
      </div>
    );
  };

  // 渲染分批创建界面
  const renderBatchCreation = () => {
    const { schemaList, currentBatch, status } = batchCreationState;
    return (
      <div>
        <h3>批量创建进度</h3>
        <List>
          {schemaList.map(schema => (
            <List.Item className='d-flex align-items-center justify-content-between' key={schema.code} style={{ marginBottom: 8 }}>
              <span>{schema.name}（{schema.code}）</span>
              {schema.status === 'created' && <Text type="success">已创建</Text>}
              {schema.status === 'creating' && <Text type="warning"><LoadingOutlined /> 创建中...</Text>}
              {schema.status === 'existing' && (
                <Text style={{ color: '#1890ff' }}>
                  已存在
                  <Tooltip title={schema.error || '该模型已存在'}>
                    <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                  </Tooltip>
                </Text>
              )}
              {schema.status === 'failed' && (
                <Text type="danger">
                  创建失败
                  <Tooltip title={schema.error || '未知错误'}>
                    <ExclamationCircleOutlined style={{ marginLeft: 4, color: '#ff4d4f' }} />
                  </Tooltip>
                  <Button size="small" type="link" onClick={() => handleRetrySchema(schema)} style={{ marginLeft: 8 }}>重试</Button>
                </Text>
              )}
              {schema.status === 'pending' && <Text type="secondary">待创建</Text>}
            </List.Item>
          ))}
        </List>
        {status === 'completed' && (
          <div style={{ marginTop: 16 }}>
            <div style={{ color: 'green', marginBottom: 16 }}>所有模型处理完成！</div>
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" onClick={handleCancel}>
                完成
              </Button>
            </div>
          </div>
        )}
        {status === 'failed' && (
          <div style={{ marginTop: 16 }}>
            <div style={{ color: 'red', marginBottom: 16 }}>部分模型创建失败，请重试失败项。</div>
            <div style={{ textAlign: 'center' }}>
              <Space>
                <Button type="default" onClick={handleCancel}>
                  关闭
                </Button>
                {(schemaList.some(s => s.status === 'pending') || schemaList.some(s => s.status === 'failed')) && (
                  <Button type="primary" onClick={handleContinueCreation}>
                    继续创建
                  </Button>
                )}
              </Space>
            </div>
          </div>
        )}
        {status === 'creating' && (
          <div style={{ marginTop: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <Button type="default" onClick={handleCancel}>
                关闭
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 新增：重试失败的表
  const handleRetrySchema = async (schema: SchemaInfo) => {
    // 不允许重试已存在的模型
    if (schema.status === 'existing') {
      message.warning('该模型已存在，无法重试');
      return;
    }
    
    setBatchCreationState(prev => {
      const updatedSchemaList = prev.schemaList.map(s =>
        s.code === schema.code ? { ...s, status: 'pending' as const, error: undefined } : s
      );
      return {
        ...prev,
        schemaList: updatedSchemaList,
        status: 'creating'
      };
    });
    setTimeout(() => {
      startNextBatch();
    }, 100);
  };

  // 新增：继续创建功能
  const handleContinueCreation = () => {
    setBatchCreationState(prev => {
      // 检查是否还有待创建的模型
      const pendingSchemas = prev.schemaList.filter(s => s.status === 'pending');
      const failedSchemas = prev.schemaList.filter(s => s.status === 'failed');
      
      if (pendingSchemas.length === 0 && failedSchemas.length === 0) {
        message.info('没有待创建的模型');
        return prev;
      }

      // 如果有失败的模型，询问用户是否要重试
      if (failedSchemas.length > 0) {
        Modal.confirm({
          title: '继续创建',
          content: (
            <div>
              <p>检测到以下模型创建失败：</p>
              <ul>
                {failedSchemas.map(schema => (
                  <li key={schema.code}>{schema.name} - {schema.error || '未知错误'}</li>
                ))}
              </ul>
              <p>您可以选择：</p>
              <p>1. 跳过失败的模型，继续创建其他模型</p>
              <p>2. 先重试失败的模型</p>
            </div>
          ),
          okText: '跳过失败模型继续创建',
          cancelText: '取消',
          onOk: () => {
            // 将失败的模型标记为跳过，重置状态为创建中
            setBatchCreationState(currentState => ({
              ...currentState,
              status: 'creating'
            }));
            
            // 延迟一下再开始下一批
            setTimeout(() => {
              startNextBatch();
            }, 100);
          }
        });
        return prev;
      }

      // 重置状态为创建中
      return {
        ...prev,
        status: 'creating'
      };
    });

    // 延迟一下再开始下一批，确保状态更新完成
    setTimeout(() => {
      startNextBatch();
    }, 100);
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
        {!generatedSchema && !generatedSchemas && batchCreationState.status === 'analyzing' ? (
          // 第一步：输入需求
          <div>
            <Title level={4}>第一步：描述你的需求</Title>
            <Paragraph type="secondary">
              请描述你想要创建的数据模型，AI 将根据你的描述自动生成完整的模型结构。如果需求涉及多个相关表，AI 会生成多个模型。
            </Paragraph>
            
            <Form form={form} layout="vertical">
              <Form.Item
                name="description"
                label="业务描述"
                rules={[{ required: true, message: '请详细描述业务需求' }]}
              >
                <TextArea
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
- 需要记录创建时间和更新时间

或者：
- 电商系统：需要用户表、商品表、订单表、分类表等
- 用户管理系统：需要用户表、角色表、权限表等
- 内容管理系统：需要文章表、分类表、标签表、用户表等"
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
              </Space>
            </div>
          </div>
        ) : batchCreationState.status !== 'analyzing' ? (
          // 分批创建界面
          renderBatchCreation()
        ) : generatedSchemas ? (
          // 多个模型确认界面
          renderMultipleSchemasConfirmation()
        ) : (
          // 单个模型确认界面
          <SchemaConfirmation
            schema={{
              ...generatedSchema!,
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
            showOptimizationNotes={false}
          />
        )}
      </div>

      {/* AI Loading 遮罩 */}
      {isAILoading && (
        <AILoading
          visible={isAILoading}
          text="AI 正在思考中...正在分析您的需求并生成模型结构..."
        />
      )}
    </Modal>
  );
};

export default AICreateSchema; 