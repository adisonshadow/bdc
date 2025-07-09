import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Space, Tag, Tooltip, Switch, message, Modal, Form, Input, Select, List, Flex, InputNumber, Cascader, TreeSelect, Badge, Popconfirm, Checkbox, notification } from 'antd';
import type { CascaderProps } from 'antd';
import type { DefaultOptionType } from 'antd/es/cascader';
import { PlusOutlined, EditOutlined, DeleteOutlined, ProfileOutlined, DeploymentUnitOutlined, ExportOutlined, BuildOutlined, ApartmentOutlined, CloudDownloadOutlined, CaretDownOutlined, CaretRightOutlined, TableOutlined, RobotOutlined, HolderOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { Splitter } from 'antd';
import { getSchemas, putSchemasId, postSchemas, deleteSchemasId, putSchemasIdLock } from '@/services/BDC/api/schemaManagement';
import { getEnums } from '@/services/BDC/api/enumManagement';
import { buildTree, enumTreeConfig } from '@/utils/treeBuilder';
import { EnumTreeNode } from '@/types/enum';
import SchemaValidator from '@/components/SchemaValidator';
import AICreateSchema from '@/components/AICreateSchema';
import { useNavigate } from 'react-router-dom';
import { handleDownloadORM } from './ormGenerator';
import AIButton from '@/components/AIButton';
import AIAssistModal from './AIAssistModal';
import EnumManagement from '@/components/EnumManagement';
// import { ConfigProvider } from 'antd';
import FieldList from './FieldList';

const { Option } = Select;

// 判断字段是否可以用作关联字段
const isValidRelationField = (field: Field) => {
  // 可以用作唯一标识的字段类型
  if (field.type === 'string' || field.type === 'number') {
    return true;
  }
  return false;
};

// 判断字段是否是主键 - 暂时注释，等待前端更新
// const isPrimaryKeyField = (field: Field) => {
//   return field.type === 'string' && field.name === 'id';
// };

type Field = API.UuidField | API.AutoIncrementField | API.StringField | API.TextField | API.NumberField | API.BooleanField | API.DateField | API.EnumField | API.RelationField | API.MediaField | API.ApiField;

// 扩展 RelationField 类型
interface ExtendedRelationField extends API.RelationField {
  relationType?: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
}

interface SchemaListItem {
  id?: string;
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
  isLocked?: boolean;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
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

interface SchemaTreeItem extends Omit<SchemaListItem, 'fields'> {
  children?: SchemaTreeItem[];
  parentCode?: string;
  fields?: Field[];
  code: string;
  name: string;
  disabled?: boolean;
}

const SchemaManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [schemas, setSchemas] = useState<SchemaListItem[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<SchemaListItem | null>(null);
  const [isSchemaModalVisible, setIsSchemaModalVisible] = useState(false);
  const [isFieldModalVisible, setIsFieldModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [schemaForm] = Form.useForm();
  const [fieldForm] = Form.useForm();
  const [fieldType, setFieldType] = useState<string>('');
  const [numberType, setNumberType] = useState<string>('');
  const [enums, setEnums] = useState<API.Enum[]>([]);
  const [enumTreeData, setEnumTreeData] = useState<EnumTreeNode[]>([]);
  const [isEnumModalVisible, setIsEnumModalVisible] = useState(false);
  const [enumSearchValue, setEnumSearchValue] = useState('');
  const [selectedEnumId, setSelectedEnumId] = useState<string>();
  const [enumDisplayText, setEnumDisplayText] = useState<string>('');
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [schemaTreeData, setSchemaTreeData] = useState<SchemaTreeItem[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [isSyncMode, setIsSyncMode] = useState(false);
  const [isAICreateModalVisible, setIsAICreateModalVisible] = useState(false);
  const [isAIAssistModalVisible, setIsAIAssistModalVisible] = useState(false);
  const [enumModalVisible, setEnumModalVisible] = useState(false);
  const navigate = useNavigate();

  // 使用 useMemo 缓存过滤后的枚举列表
  const filteredEnums = useMemo(() => {
    return enums.filter(e => {
      return !enumSearchValue || 
        e.name.toLowerCase().includes(enumSearchValue.toLowerCase()) ||
        e.code.toLowerCase().includes(enumSearchValue.toLowerCase());
    });
  }, [enums, enumSearchValue]);

  // 字段类型选项
  const fieldTypes = [
    { label: 'UUID', value: 'uuid' },
    { label: '自增长ID', value: 'auto_increment' },
    { label: '字符串', value: 'string' },
    { label: '文本', value: 'text' },
    { label: '数字', value: 'number' },
    { label: '布尔值', value: 'boolean' },
    { label: '日期', value: 'date' },
    { label: '枚举', value: 'enum' },
    { label: '关联', value: 'relation' },
    { label: '媒体', value: 'media' },
    { label: 'API', value: 'api' }
  ];

  // 将扁平数据转换为树形结构
  const buildSchemaTree = (schemas: SchemaListItem[]): SchemaTreeItem[] => {
    const codeMap = new Map<string, SchemaTreeItem>();
    const result: SchemaTreeItem[] = [];
    const allCodes: string[] = []; // 收集所有节点的 code

    // 首先创建所有节点
    schemas.forEach(schema => {
      const codes = schema.code.split(':');
      let currentPath = '';
      
      codes.forEach((code, index) => {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}:${code}` : code;
        allCodes.push(currentPath); // 添加到所有 codes 列表
        
        if (!codeMap.has(currentPath)) {
          const node: SchemaTreeItem = {
            ...(index === codes.length - 1 ? {
              ...schema,
              fields: schema.fields || []
            } : {}),
            code: currentPath,
            name: index === codes.length - 1 ? schema.name : code,
            children: [],
            parentCode: parentPath || undefined,
            fields: index === codes.length - 1 ? schema.fields || [] : []
          };
          codeMap.set(currentPath, node);
        }
      });
    });

    // 构建树形结构
    codeMap.forEach((node) => {
      if (node.parentCode) {
        const parent = codeMap.get(node.parentCode);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        result.push(node);
      }
    });

    // 设置所有节点为展开状态
    setExpandedRowKeys(allCodes);

    return result;
  };

  const fetchSchemas = async () => {
    setLoading(true);
    try {
      const response = await getSchemas({
        code: undefined,
        name: undefined
      });
      
      const transformedData: SchemaListItem[] = response.map(item => {
        const fields = (item.fields || []).map(field => {
          const fieldData = field as any;
          const baseField = {
            id: fieldData.id,
            name: fieldData.name,
            description: fieldData.description,
            required: fieldData.required,
            // isPrimaryKey: fieldData.isPrimaryKey, // 暂时注释，等待前端更新
            length: fieldData.length
          };

          switch (fieldData.type) {
            case 'uuid': {
              const typedField: API.UuidField = {
                ...baseField,
                type: 'uuid'
              };
              return typedField;
            }
            case 'auto_increment': {
              const typedField: API.AutoIncrementField = {
                ...baseField,
                type: 'auto_increment'
              };
              return typedField;
            }
            case 'string': {
              const typedField: API.StringField = {
                ...baseField,
                type: 'string',
                length: fieldData.length
              };
              return typedField;
            }
            case 'text': {
              const typedField: API.TextField = {
                ...baseField,
                type: 'text'
              };
              return typedField;
            }
            case 'number': {
              const typedField: API.NumberField = {
                ...baseField,
                type: 'number',
                numberConfig: fieldData.numberConfig || {
                  numberType: fieldData.numberType,
                  precision: fieldData.precision,
                  scale: fieldData.scale
                }
              };
              return typedField;
            }
            case 'boolean': {
              const typedField: API.BooleanField = {
                ...baseField,
                type: 'boolean'
              };
              return typedField;
            }
            case 'date': {
              const typedField: API.DateField = {
                ...baseField,
                type: 'date',
                dateConfig: fieldData.dateConfig || {
                  dateType: fieldData.dateType
                }
              };
              return typedField;
            }
            case 'enum': {
              const typedField: API.EnumField = {
                ...baseField,
                type: 'enum',
                enumConfig: fieldData.enumConfig || {
                  targetEnumCode: fieldData.targetEnumCode,
                  multiple: fieldData.multiple,
                  defaultValues: fieldData.defaultValues
                }
              };
              return typedField;
            }
            case 'relation': {
              const typedField: API.RelationField = {
                ...baseField,
                type: 'relation',
                relationConfig: fieldData.relationConfig || {
                  targetSchemaCode: fieldData.targetSchemaCode,
                  targetField: fieldData.targetField,
                  multiple: fieldData.multiple || false,
                  cascadeDelete: fieldData.cascadeDelete || 'restrict',
                  displayFields: fieldData.displayFields || []
                }
              };
              return typedField;
            }
            case 'media': {
              const typedField: API.MediaField = {
                ...baseField,
                type: 'media',
                mediaConfig: fieldData.mediaConfig || {
                  mediaType: fieldData.mediaType,
                  formats: fieldData.formats || [],
                  maxSize: fieldData.maxSize,
                  multiple: fieldData.multiple
                }
              };
              return typedField;
            }
            case 'api': {
              const typedField: API.ApiField = {
                ...baseField,
                type: 'api',
                apiConfig: fieldData.apiConfig || {
                  endpoint: fieldData.endpoint,
                  method: fieldData.method,
                  multiple: fieldData.multiple,
                  params: fieldData.params,
                  headers: fieldData.headers,
                  resultMapping: fieldData.resultMapping
                }
              };
              return typedField;
            }
            default:
              throw new Error(`未知的字段类型: ${fieldData.type}`);
          }
        }) as unknown as Field[];

        const itemData = item as any;
        const schemaItem: SchemaListItem = {
          id: itemData.id || '',
          name: itemData.name || '',
          code: itemData.code || '',
          description: itemData.description,
          isActive: itemData.isActive,
          isLocked: itemData.isLocked,
          version: itemData.version,
          createdAt: itemData.createdAt,
          updatedAt: itemData.updatedAt,
          fields,
          keyIndexes: itemData.keyIndexes || {
            primaryKey: [],
            indexes: []
          }
        };
        
        // 调试日志：检查keyIndexes数据
        // if (itemData.keyIndexes) {
        //   console.log(`Schema ${schemaItem.name} keyIndexes:`, itemData.keyIndexes);
        // }
        
        return schemaItem;
      });

      setSchemas(transformedData);
      setSchemaTreeData(buildSchemaTree(transformedData));
    } catch (error) {
      message.error('获取数据表列表失败');
    }
    setLoading(false);
  };

  const fetchEnums = async () => {
    console.log('开始获取枚举列表');
    try {
      const response = await getEnums({});
      console.log('枚举列表响应:', response);
      setEnums(response);
      // 构建枚举树
      const treeData = buildTree(response, enumTreeConfig);
      console.log('枚举树数据:', treeData);
      setEnumTreeData(treeData);
    } catch (error: any) {
      console.error('获取枚举列表失败:', error);
      message.error('获取枚举列表失败');
    }
  };

  useEffect(() => {
    fetchSchemas();
    fetchEnums();

    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    // 注册窗口大小变化事件
    window.addEventListener('resize', handleResize);
    
    // 组件卸载时移除事件监听
    return () => {
      window.removeEventListener('resize', handleResize);
    };

  }, []);

  const handleSchemaSelect = (schema: SchemaListItem) => {
    console.log('Selected schema:', schema);
    setSelectedSchema(schema);
  };

  const handleSchemaCreate = async (values: any) => {
    try {
      await postSchemas({
        name: values.name,
        code: values.code,
        description: values.description,
        fields: []
      });
      message.success('创建成功');
      setIsSchemaModalVisible(false);
      schemaForm.resetFields();
      fetchSchemas();
    } catch (error) {
      message.error('创建失败');
    }
  };

  // 处理模型删除
  const handleSchemaDelete = async (id: string) => {
    try {
      await deleteSchemasId({ id });
      message.success("删除成功");
      fetchSchemas();
      if (selectedSchema?.id === id) {
        setSelectedSchema(null);
      }
    } catch (error) {
      message.error("删除失败");
    }
  };

  // 处理模型锁定/解锁
  const handleSchemaLockToggle = async (schema: SchemaListItem) => {
    const newLockedState = !schema.isLocked;
    try {
      await putSchemasIdLock(
        { id: schema.id! },
        {
          isLocked: newLockedState
        }
      );
      message.success(newLockedState ? "模型已锁定" : "模型已解锁");
      
      // 立即更新当前选中的模型状态
      if (selectedSchema && selectedSchema.id === schema.id) {
        setSelectedSchema({
          ...selectedSchema,
          isLocked: newLockedState
        });
      }
      
      // 重新获取所有模型数据
      fetchSchemas();
    } catch (error) {
      message.error(newLockedState ? "锁定失败" : "解锁失败");
    }
  };

  const handleFieldCreate = async (values: any) => {
    if (!selectedSchema?.id) return;
    
    try {
      console.log('开始创建字段，values:', values);
      
      let newField: Field;
      const baseFieldData = {
        id: crypto.randomUUID(),
        name: values.name,
        type: values.type as API.BaseField['type'],
        description: values.description,
        required: values.required,
        // isPrimaryKey: values.isPrimaryKey, // 暂时注释，等待前端更新
        length: values.length
      };

      console.log('基础字段数据:', baseFieldData);

      // 根据字段类型创建正确的类型
      switch (values.type) {
        case 'uuid':
          newField = {
            ...baseFieldData,
            type: 'uuid'
          } as API.UuidField;
          break;
        case 'auto_increment':
          newField = {
            ...baseFieldData,
            type: 'auto_increment'
          } as API.AutoIncrementField;
          break;
        case 'string':
          newField = {
            ...baseFieldData,
            type: 'string'
          } as API.StringField;
          break;
        case 'text':
          newField = {
            ...baseFieldData,
            type: 'text'
          } as API.TextField;
          break;
        case 'number':
          newField = {
            ...baseFieldData,
            type: 'number',
            numberConfig: {
              numberType: values.numberType,
              precision: values.precision,
              scale: values.scale
            }
          } as API.NumberField;
          break;
        case 'boolean':
          newField = {
            ...baseFieldData,
            type: 'boolean'
          } as API.BooleanField;
          break;
        case 'date':
          newField = {
            ...baseFieldData,
            type: 'date',
            dateConfig: {
              dateType: values.dateType
            }
          } as API.DateField;
          break;
        case 'enum':
          newField = {
            ...baseFieldData,
            type: 'enum',
            enumConfig: {
              targetEnumCode: values.targetEnumCode,
              multiple: values.multiple,
              defaultValues: values.defaultValues
            }
          } as API.EnumField;
          break;
        case 'relation':
          newField = {
            ...baseFieldData,
            type: 'relation',
            relationConfig: {
              targetSchemaCode: values.targetSchema,
              targetField: values.targetField,
              multiple: ['oneToMany', 'manyToMany'].includes(values.relationType),
              cascadeDelete: values.cascadeDelete,
              displayFields: values.displayFields || []
            }
          } as API.RelationField;
          break;
        case 'media':
          newField = {
            ...baseFieldData,
            type: 'media',
            mediaConfig: {
              mediaType: values.mediaType,
              formats: values.formats || [],
              maxSize: values.maxSize,
              multiple: values.multiple
            }
          } as API.MediaField;
          break;
        case 'api':
          newField = {
            ...baseFieldData,
            type: 'api',
            apiConfig: {
              endpoint: values.endpoint,
              method: values.method,
              multiple: values.multiple,
              params: values.params,
              headers: values.headers,
              resultMapping: values.resultMapping
            }
          } as API.ApiField;
          break;
        default:
          throw new Error(`未知的字段类型: ${values.type}`);
      }

      console.log('新创建的字段:', newField);

      const updatedFields = [...selectedSchema.fields, newField];
      
      console.log('准备发送的字段列表:', updatedFields);
      console.log('发送到API的数据:', {
        id: selectedSchema.id,
        fields: updatedFields
      });
      
      await putSchemasId(
        { id: selectedSchema.id },
        {
          fields: updatedFields as any
        }
      );
      message.success('字段添加成功');
      setIsFieldModalVisible(false);
      fieldForm.resetFields();
      fetchSchemas();
      setSelectedSchema({
        ...selectedSchema,
        fields: updatedFields,
      });
    } catch (error: any) {
      console.error('字段添加失败，详细错误:', error);
      console.error('错误响应:', error.response);
      console.error('错误消息:', error.message);
      
      let errorMessage = '字段添加失败';
      if (error.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      message.error(errorMessage);
    }
  };

  const handleFieldEdit = async (values: any, index: number) => {
    if (!selectedSchema?.id) return;
    
    try {
      console.log('开始编辑字段，values:', values);
      console.log('当前字段索引:', index);
      console.log('当前字段:', selectedSchema.fields[index]);
      
      let updatedField: Field;
      const baseFieldData = {
        id: selectedSchema.fields[index].id,
        name: values.name,
        type: values.type as API.BaseField['type'],
        description: values.description,
        required: values.required,
        // isPrimaryKey: values.isPrimaryKey, // 暂时注释，等待前端更新
        length: values.length
      };

      console.log('基础字段数据:', baseFieldData);

      // 根据字段类型创建正确的类型
      switch (values.type) {
        case 'uuid':
          updatedField = {
            ...baseFieldData,
            type: 'uuid'
          } as API.UuidField;
          break;
        case 'auto_increment':
          updatedField = {
            ...baseFieldData,
            type: 'auto_increment'
          } as API.AutoIncrementField;
          break;
        case 'string':
          updatedField = {
            ...baseFieldData,
            type: 'string'
          } as API.StringField;
          break;
        case 'text':
          updatedField = {
            ...baseFieldData,
            type: 'text'
          } as API.TextField;
          break;
        case 'number':
          updatedField = {
            ...baseFieldData,
            type: 'number',
            numberConfig: {
              numberType: values.numberType,
              precision: values.precision,
              scale: values.scale
            }
          } as API.NumberField;
          break;
        case 'boolean':
          updatedField = {
            ...baseFieldData,
            type: 'boolean'
          } as API.BooleanField;
          break;
        case 'date':
          updatedField = {
            ...baseFieldData,
            type: 'date',
            dateConfig: {
              dateType: values.dateType
            }
          } as API.DateField;
          break;
        case 'enum':
          updatedField = {
            ...baseFieldData,
            type: 'enum',
            enumConfig: {
              targetEnumCode: values.targetEnumCode,
              multiple: values.multiple,
              defaultValues: values.defaultValues
            }
          } as API.EnumField;
          break;
        case 'relation':
          updatedField = {
            ...baseFieldData,
            type: 'relation',
            relationConfig: {
              targetSchemaCode: values.targetSchema,
              targetField: values.targetField,
              multiple: ['oneToMany', 'manyToMany'].includes(values.relationType),
              cascadeDelete: values.cascadeDelete,
              displayFields: values.displayFields || []
            }
          } as API.RelationField;
          break;
        case 'media':
          updatedField = {
            ...baseFieldData,
            type: 'media',
            mediaConfig: {
              mediaType: values.mediaType,
              formats: values.formats || [],
              maxSize: values.maxSize,
              multiple: values.multiple
            }
          } as API.MediaField;
          break;
        case 'api':
          updatedField = {
            ...baseFieldData,
            type: 'api',
            apiConfig: {
              endpoint: values.endpoint,
              method: values.method,
              multiple: values.multiple,
              params: values.params,
              headers: values.headers,
              resultMapping: values.resultMapping
            }
          } as API.ApiField;
          break;
        default:
          throw new Error(`未知的字段类型: ${values.type}`);
      }

      const updatedFields = [...selectedSchema.fields];
      updatedFields[index] = updatedField;
      
      console.log('准备发送的字段列表:', updatedFields);
      console.log('发送到API的数据:', {
        id: selectedSchema.id,
        fields: updatedFields
      });
      
      await putSchemasId(
        { id: selectedSchema.id },
        {
          fields: updatedFields as any
        }
      );
      message.success('字段更新成功');
      setIsFieldModalVisible(false);
      fieldForm.resetFields();
      fetchSchemas();
      setSelectedSchema({
        ...selectedSchema,
        fields: updatedFields,
      });
    } catch (error: any) {
      console.error('字段更新失败，详细错误:', error);
      console.error('错误响应:', error.response);
      console.error('错误消息:', error.message);
      
      let errorMessage = '字段更新失败';
      if (error.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      message.error(errorMessage);
    }
  };

  const handleFieldDelete = async (index: number) => {
    if (!selectedSchema?.id) return;
    
    try {
      const updatedFields = selectedSchema.fields.filter((_, i) => i !== index);
      await putSchemasId(
        { id: selectedSchema.id },
        {
          fields: updatedFields as any
        }
      );
      message.success('字段删除成功');
      fetchSchemas();
      setSelectedSchema({
        ...selectedSchema,
        fields: updatedFields,
      });
    } catch (error) {
      message.error('字段删除失败');
    }
  };

  // 处理字段重排序
  const handleFieldsReorder = async (reorderedFields: Field[]) => {
    if (!selectedSchema?.id) return;
    
    try {
      await putSchemasId(
        { id: selectedSchema.id },
        {
          fields: reorderedFields as any
        }
      );
      message.success('字段顺序更新成功');
      fetchSchemas();
      setSelectedSchema({
        ...selectedSchema,
        fields: reorderedFields,
      });
    } catch (error) {
      message.error('字段顺序更新失败');
    }
  };

  // 字段名验证规则
  const validateFieldName = (_: unknown, value: string) => {
    if (!value) {
      return Promise.reject('请输入字段名');
    }
    if (!/^[a-z][a-z0-9_]*$/.test(value)) {
      return Promise.reject('字段名必须以小写字母开头，只能包含小写字母、数字和下划线');
    }
    return Promise.resolve();
  };

  // 处理同步模式切换
  const handleSyncModeToggle = () => {
    setIsSyncMode(!isSyncMode);
    if (isSyncMode) {
      // 退出同步模式时清空选择
      setSelectedRowKeys([]);
    }
  };

  // 处理将选择中的表下载为ORM文件
  const handleDownloadORMClick = async () => {
    // 获取选中的数据表
    const selectedSchemas = schemas.filter(schema => selectedRowKeys.includes(schema.code));
    
    // 调用 ORM 生成器，传入枚举数据
    await handleDownloadORM(selectedSchemas, schemas, enums);
  };

  // 处理自动修复
  const handleAutoFix = async (fixedFields: Field[], fixedKeyIndexes: any) => {
    if (!selectedSchema) {
      message.error('没有选中的数据模型');
      return;
    }

    try {
      // 更新选中的数据模型
      const updatedSchema = {
        ...selectedSchema,
        fields: fixedFields,
        keyIndexes: fixedKeyIndexes
      };

      // 调用 API 更新数据模型
      const apiPayload = {
        fields: updatedSchema.fields as any,
        keyIndexes: updatedSchema.keyIndexes
      };
      
      await putSchemasId(
        { id: selectedSchema.id! },
        apiPayload
      );

      // 更新本地状态
      setSelectedSchema(updatedSchema);
      
      // 重新获取数据模型列表和枚举列表
      await Promise.all([
        fetchSchemas(),
        fetchEnums()
      ]);
      
      message.success('自动修复完成！');
    } catch (error) {
      console.error('自动修复失败:', error);
      message.error('自动修复失败，请检查网络连接或手动修复');
    }
  };

  // 处理字段优化
  const handleFieldOptimize = async (optimizedFields: Field[], optimizedKeyIndexes: any) => {
    if (!selectedSchema) {
      message.error('没有选中的数据模型');
      return;
    }

    try {
      // 添加调试日志
      console.log('=== AI 优化调试信息 ===');
      console.log('原始 selectedSchema:', selectedSchema);
      console.log('优化后的字段:', optimizedFields);
      console.log('优化后的 keyIndexes:', optimizedKeyIndexes);
      
      // 更新选中的数据模型
      const updatedSchema = {
        ...selectedSchema,
        fields: optimizedFields,
        keyIndexes: optimizedKeyIndexes
      };

      console.log('更新后的 schema:', updatedSchema);

      // 调用 API 更新数据模型
      const apiPayload = {
        fields: updatedSchema.fields as any,
        keyIndexes: updatedSchema.keyIndexes
      };
      
      console.log('发送到 API 的数据:', apiPayload);
      
      await putSchemasId(
        { id: selectedSchema.id! },
        apiPayload
      );

      // 更新本地状态
      setSelectedSchema(updatedSchema);
      
      // 重新获取数据模型列表和枚举列表
      await Promise.all([
        fetchSchemas(),
        fetchEnums()
      ]);
      
      message.success('字段优化完成！');
    } catch (error) {
      console.error('字段优化失败:', error);
      message.error('字段优化失败，请检查网络连接或重试');
    }
  };

  // 处理 AI 新建模型
  const handleAICreateSchema = async (schemaData: {
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
  }) => {
    try {
      // 判断是单个模型还是多个模型
      if ('schemas' in schemaData) {
        // 多个模型 - 使用批量创建API
        const schemasToCreate = schemaData.schemas.map(schema => {
          const modelName = schema.code.split(':').pop() || schema.code;
          return {
            name: modelName,
            code: schema.code,
            description: schema.name,
            fields: schema.fields as any,
            keyIndexes: schema.keyIndexes
          };
        });

        // 调用批量创建API
        await postSchemas(schemasToCreate);

        // 重新获取数据模型列表和枚举列表
        await Promise.all([
          fetchSchemas(),
          fetchEnums()
        ]);
        
        message.success(`AI 创建 ${schemasToCreate.length} 个数据模型成功！`);
      } else {
        // 单个模型 - 使用原有的创建方式
        const modelName = schemaData.code.split(':').pop() || schemaData.code;
        
        // 调用 API 创建数据模型
        await postSchemas({
          name: modelName,
          code: schemaData.code,
          description: schemaData.name,
          fields: schemaData.fields as any,
          keyIndexes: schemaData.keyIndexes
        });

        // 重新获取数据模型列表和枚举列表
        await Promise.all([
          fetchSchemas(),
          fetchEnums()
        ]);
        
        message.success('AI 创建数据模型成功！');
      }
    } catch (error: any) {
      console.error('AI 创建数据模型失败:', error);
      // 获取详细的错误信息
      const errorMessage = error?.response?.data?.message || error?.message || 'AI 创建数据模型失败，请检查网络连接或重试';
      message.error(`创建失败：${errorMessage}`);
      // 不再抛出异常，避免未处理的 Promise 拒绝
    }
  };

  // 处理全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // 全选：获取所有叶子节点的code
      const allLeafCodes: string[] = [];
      const collectLeafCodes = (nodes: SchemaTreeItem[]) => {
        nodes.forEach(node => {
          if (node.children?.length) {
            collectLeafCodes(node.children);
          } else {
            allLeafCodes.push(node.code);
          }
        });
      };
      collectLeafCodes(schemaTreeData);
      setSelectedRowKeys(allLeafCodes);
    } else {
      // 取消全选
      setSelectedRowKeys([]);
    }
  };

  // 检查是否全选
  const isAllSelected = useMemo(() => {
    const allLeafCodes: string[] = [];
    const collectLeafCodes = (nodes: SchemaTreeItem[]) => {
      nodes.forEach(node => {
        if (node.children?.length) {
          collectLeafCodes(node.children);
        } else {
          allLeafCodes.push(node.code);
        }
      });
    };
    collectLeafCodes(schemaTreeData);
    return allLeafCodes.length > 0 && selectedRowKeys.length === allLeafCodes.length;
  }, [schemaTreeData, selectedRowKeys]);

  // 检查是否部分选中
  const isIndeterminate = useMemo(() => {
    const allLeafCodes: string[] = [];
    const collectLeafCodes = (nodes: SchemaTreeItem[]) => {
      nodes.forEach(node => {
        if (node.children?.length) {
          collectLeafCodes(node.children);
        } else {
          allLeafCodes.push(node.code);
        }
      });
    };
    collectLeafCodes(schemaTreeData);
    return selectedRowKeys.length > 0 && selectedRowKeys.length < allLeafCodes.length;
  }, [schemaTreeData, selectedRowKeys]);

  // 处理虚拟节点选择（全选/全不选子节点）
  const handleVirtualNodeSelect = (record: SchemaTreeItem, checked: boolean) => {
    if (!record.children?.length) return;
    
    // 收集所有子节点的 code
    const childCodes: string[] = [];
    const collectChildCodes = (nodes: SchemaTreeItem[]) => {
      nodes.forEach(node => {
        if (node.children?.length) {
          collectChildCodes(node.children);
        } else {
          childCodes.push(node.code);
        }
      });
    };
    collectChildCodes(record.children);
    
    // 更新选中状态
    if (checked) {
      // 全选：添加所有子节点
      const newSelectedKeys = [...selectedRowKeys];
      childCodes.forEach(code => {
        if (!newSelectedKeys.includes(code)) {
          newSelectedKeys.push(code);
        }
      });
      setSelectedRowKeys(newSelectedKeys);
    } else {
      // 全不选：移除所有子节点
      setSelectedRowKeys(selectedRowKeys.filter(key => !childCodes.includes(key)));
    }
  };

  // 检查虚拟节点的选中状态
  const getVirtualNodeCheckedStatus = (record: SchemaTreeItem) => {
    if (!record.children?.length) return { checked: false, indeterminate: false };
    
    const childCodes: string[] = [];
    const collectChildCodes = (nodes: SchemaTreeItem[]) => {
      nodes.forEach(node => {
        if (node.children?.length) {
          collectChildCodes(node.children);
        } else {
          childCodes.push(node.code);
        }
      });
    };
    collectChildCodes(record.children);
    
    const selectedChildCount = childCodes.filter(code => selectedRowKeys.includes(code)).length;
    
    if (selectedChildCount === 0) {
      return { checked: false, indeterminate: false };
    } else if (selectedChildCount === childCodes.length) {
      return { checked: true, indeterminate: false };
    } else {
      return { checked: false, indeterminate: true };
    }
  };

  const schemaColumns = [
    // 自定义 checkbox 列
    ...(isSyncMode ? [{
      title: (
        <Checkbox
          checked={isAllSelected}
          indeterminate={isIndeterminate}
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      ),
      key: 'selection',
      width: 60,
      fixed: 'left' as const,
      render: (_: unknown, record: SchemaTreeItem) => {
        if (record.children?.length) {
          // 虚拟节点：根据子节点状态显示
          const status = getVirtualNodeCheckedStatus(record);
          return (
            <Checkbox
              checked={status.checked}
              indeterminate={status.indeterminate}
              onChange={(e) => {
                e.stopPropagation();
                handleVirtualNodeSelect(record, e.target.checked);
              }}
            />
          );
        } else {
          // 叶子节点：正常状态
          return (
            <Checkbox
              checked={selectedRowKeys.includes(record.code)}
              onChange={(e) => {
                e.stopPropagation();
                if (e.target.checked) {
                  setSelectedRowKeys([...selectedRowKeys, record.code]);
                } else {
                  setSelectedRowKeys(selectedRowKeys.filter(key => key !== record.code));
                }
              }}
            />
          );
        }
      },
    }] : []),
    {
      title: 'code',
      dataIndex: 'code',
      key: 'code',
      render: (text: string, record: SchemaTreeItem) => {
        // 获取当前层级的名称（最后一个冒号后的部分）
        const currentLevelName = text.split(':').pop() || '';
        return (
          <span style={{ color: record.children?.length ? '#999' : undefined }}>
            {!record.children?.length && <BuildOutlined style={{ fontSize: '12px', marginRight: '8px', color: '#666' }} />}
            {currentLevelName}
          </span>
        );
      },
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: SchemaTreeItem) => {
        // 只有叶子节点显示完整信息
        if (record.children?.length) {
          return null;
        }
        return (
          <div>
            <Space>
                <Badge status={record.isActive ? 'success' : 'default'}/>
                <span>{text}</span>
            </Space>
            {record.description && (
              <div style={{ color: '#666', fontSize: '12px' }}>
                {record.description}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 120,
      render: (_: unknown, record: SchemaTreeItem) => {
        // 只有叶子节点显示操作按钮
        if (record.children?.length) return null;
        return (
          <Flex justify='end'>
            <Tooltip title={record.isLocked ? "解锁模型" : "锁定模型"}>
              <Button
                type="link"
                icon={record.isLocked ? <LockOutlined /> : <UnlockOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSchemaLockToggle(record as SchemaListItem);
                }}
              />
            </Tooltip>
            <Button
              type="link"
              icon={<EditOutlined />}
              disabled={record.isLocked}
              onClick={(e) => {
                e.stopPropagation();
                schemaForm.setFieldsValue(record);
                setIsSchemaModalVisible(true);
              }}
            />
            <Popconfirm
              title="删除数据模型"
              description={`确定要删除 "${record.name}" 吗？此操作不可恢复。`}
              onConfirm={(e) => {
                e?.stopPropagation();
                handleSchemaDelete(record.id!);
              }}
              onCancel={(e) => e?.stopPropagation()}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                disabled={record.isLocked}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </Flex>
        );
      },
    },
  ];

  // 获取字段的索引类型
  const getFieldIndexType = (fieldName: string) => {
    if (!selectedSchema?.keyIndexes) return '';
    
    // 调试日志
    // console.log(`Checking index type for field: ${fieldName}`, {
    //   keyIndexes: selectedSchema.keyIndexes,
    //   primaryKey: selectedSchema.keyIndexes.primaryKey,
    //   indexes: selectedSchema.keyIndexes.indexes
    // });
    
    // 检查是否为主键
    if (selectedSchema.keyIndexes.primaryKey?.includes(fieldName)) {
      return 'primary';
    }
    
    // 检查是否为其他索引
    const index = selectedSchema.keyIndexes.indexes?.find((idx: any) => 
      idx.fields?.includes(fieldName)
    );
    
    const result = index?.type || '';
    // console.log(`Index type result for ${fieldName}:`, result);
    return result;
  };

  // 检查字段类型是否适合做主键
  const isFieldSuitableForPrimaryKey = (field: Field): { suitable: boolean; reason?: string } => {
    // 不适合做主键的字段类型
    const unsuitableTypes = ['text', 'media', 'api'];
    
    if (unsuitableTypes.includes(field.type)) {
      return { 
        suitable: false, 
        reason: `${field.type} 类型字段不适合作为主键，因为这种类型通常用于存储大量文本、媒体文件或API数据` 
      };
    }
    
    // 检查日期类型字段
    if (field.type === 'date') {
      return { 
        suitable: false, 
        reason: '日期类型字段不适合作为主键，因为日期值可能会重复且不够稳定' 
      };
    }
    
    // 检查枚举类型字段
    if (field.type === 'enum') {
      return { 
        suitable: false, 
        reason: '枚举类型字段不适合作为主键，因为枚举值有限且可能重复' 
      };
    }
    
    // 检查关联类型字段
    if (field.type === 'relation') {
      return { 
        suitable: false, 
        reason: '关联类型字段不适合作为主键，建议使用关联的目标字段作为主键' 
      };
    }
    
    // 检查布尔类型字段
    if (field.type === 'boolean') {
      return { 
        suitable: false, 
        reason: '布尔类型字段不适合作为主键，因为只有两个可能的值，无法唯一标识记录' 
      };
    }
    
    // 适合做主键的字段类型
    const suitableTypes = ['uuid', 'auto_increment', 'string', 'number'];
    if (suitableTypes.includes(field.type)) {
      return { suitable: true };
    }
    
    return { suitable: true };
  };

  // 检查是否有UUID或自增长字段
  const hasUuidOrAutoIncrementField = (): boolean => {
    return selectedSchema?.fields.some(field => 
      field.type === 'uuid' || field.type === 'auto_increment'
    ) || false;
  };

  // 处理索引类型变更
  const handleIndexTypeChange = async (fieldName: string, indexType: string) => {
    if (!selectedSchema) return;
    
    // 获取当前字段
    const currentField = selectedSchema.fields.find(field => field.name === fieldName);
    if (!currentField) return;
    
    // 如果是设置主键，进行验证
    if (indexType === 'primary') {
      // 1. 检查字段类型是否适合做主键
      const fieldSuitability = isFieldSuitableForPrimaryKey(currentField);
      if (!fieldSuitability.suitable) {
        notification.warning({
          message: '字段类型不适合做主键',
          description: `字段 "${fieldName}" 的类型为 ${currentField.type}。${fieldSuitability.reason}。建议使用 UUID、自增长ID 或字符串类型字段作为主键。`,
          duration: 5,
        });
        // 不阻止保存，只是提醒用户
      }
    }
    
    // 如果是设置全文索引，进行验证
    if (indexType === 'fulltext') {
      // 全文索引只适用于文本类型字段
      if (currentField.type !== 'text' && currentField.type !== 'string') {
        notification.warning({
          message: '字段类型不适合做全文索引',
          description: `字段 "${fieldName}" 的类型为 ${currentField.type}。全文索引只适用于文本类型字段（text、string）。`,
          duration: 5,
        });
        return;
      }
    }
    
    // 如果是设置空间索引，进行验证
    if (indexType === 'spatial') {
      // 空间索引只适用于特定的几何类型字段（这里可以根据需要扩展）
      if (currentField.type !== 'string') {
        notification.warning({
          message: '字段类型不适合做空间索引',
          description: `字段 "${fieldName}" 的类型为 ${currentField.type}。空间索引通常适用于存储几何数据的字段。`,
          duration: 5,
        });
        return;
      }
    }
    
    // 2. 检查是否已有主键，以及是否有UUID或自增长字段（仅在设置主键时）
    if (indexType === 'primary') {
      const currentPrimaryKeys = selectedSchema.keyIndexes?.primaryKey || [];
      const hasUuidOrAutoIncrement = hasUuidOrAutoIncrementField();
      
      if (currentPrimaryKeys.length > 0 && hasUuidOrAutoIncrement) {
        // 显示确认对话框
        Modal.confirm({
          title: '创建联合主键',
          content: (
            <div>
              <p><strong>当前已有主键字段：</strong>{currentPrimaryKeys.join(', ')}</p>
              <p><strong>要添加的主键字段：</strong>{fieldName}</p>
              <p style={{ marginTop: '12px', color: '#666' }}>
                系统中存在 UUID 或自增长字段，通常这些字段更适合作为单一主键。
                联合主键适用于需要多个字段组合来唯一标识记录的场景。
              </p>
              <p style={{ color: '#666' }}>
                您确定要创建联合主键吗？
              </p>
            </div>
          ),
          okText: '创建联合主键',
          cancelText: '取消',
          width: 500,
          onOk: () => {
            updateSchemaKeyIndexes(fieldName, indexType);
          },
          onCancel: () => {
            // 取消操作，不更新
          }
        });
        return;
      }
    }
    
    // 直接更新索引
    updateSchemaKeyIndexes(fieldName, indexType);
  };

  // 更新Schema的keyIndexes
  const updateSchemaKeyIndexes = async (fieldName: string, indexType: string) => {
    if (!selectedSchema) return;
    
    const updatedSchema = { ...selectedSchema };
    if (!updatedSchema.keyIndexes) {
      updatedSchema.keyIndexes = { primaryKey: [], indexes: [] };
    }
    
    // 移除字段的所有现有索引
    if (updatedSchema.keyIndexes.primaryKey) {
      updatedSchema.keyIndexes.primaryKey = updatedSchema.keyIndexes.primaryKey.filter(
        field => field !== fieldName
      );
    }
    
    if (updatedSchema.keyIndexes.indexes) {
      updatedSchema.keyIndexes.indexes = updatedSchema.keyIndexes.indexes.filter(
        index => !index.fields?.includes(fieldName)
      );
    }
    
    // 添加新的索引类型
    if (indexType === 'primary') {
      if (!updatedSchema.keyIndexes.primaryKey) {
        updatedSchema.keyIndexes.primaryKey = [];
      }
      updatedSchema.keyIndexes.primaryKey.push(fieldName);
    } else if (['unique', 'normal', 'fulltext', 'spatial'].includes(indexType)) {
      if (!updatedSchema.keyIndexes.indexes) {
        updatedSchema.keyIndexes.indexes = [];
      }
      updatedSchema.keyIndexes.indexes.push({
        name: `${fieldName}_${indexType}`,
        fields: [fieldName],
        type: indexType as 'unique' | 'normal' | 'fulltext' | 'spatial'
      });
    }
    
    try {
      await putSchemasId({
        id: selectedSchema.id!
      }, {
        name: updatedSchema.name,
        description: updatedSchema.description,
        fields: updatedSchema.fields as any,
        keyIndexes: updatedSchema.keyIndexes
      } as any);
      
      // 更新本地状态
      setSelectedSchema(updatedSchema);
      setSchemas(prevSchemas => 
        prevSchemas.map(schema => 
          schema.id === selectedSchema.id ? updatedSchema : schema
        )
      );
      
      message.success('索引设置已更新');
    } catch (error) {
      message.error('更新索引设置失败');
      console.error('更新索引设置失败:', error);
    }
  };

  const renderFieldList = () => {
    if (!selectedSchema) {
      return (
        <div className="d-flex mt-5 pt-5 flex-column align-items-center justify-content-center">
          <img src="/toleft.svg" alt="empty" style={{ width: '100px', height: '100px' }} />
          <p style={{ textAlign: 'center', padding: '5px' }}>请选择左侧的数据模型</p>
        </div>
      );
    }

    // 获取关系类型显示文本
    const getRelationTypeText = (field: ExtendedRelationField) => {
      const type = field.relationType || (field.relationConfig?.multiple ? 'oneToMany' : 'oneToOne');
      switch (type) {
        case 'oneToOne': return '1:1';
        case 'oneToMany': return '1:n';
        case 'manyToOne': return 'n:1';
        case 'manyToMany': return 'm:n';
        default: return '1:1';
      }
    };

    // 获取目标数据模型的描述信息
    const getTargetSchemaDescription = (code: string | undefined) => {
      if (!code) return '';
      const schema = schemas.find(s => s.code === code);
      return schema ? `${code}（${schema.name}）` : code;
    };

    // 获取枚举的描述信息
    const getEnumDescription = (enumCode: string | undefined) => {
      if (!enumCode) return '';
      const enumItem = enums.find(e => e.code === enumCode);
      if (!enumItem) return enumCode;
      // 将冒号分隔的路径转换为斜杠分隔
      const path = enumItem.code.replace(/:/g, ' / ');
      return `${path}（${enumItem.description || enumItem.name}）`;
    };

    return (
      <FieldList
        fields={selectedSchema.fields}
        isLocked={selectedSchema.isLocked}
        onFieldEdit={handleEditField}
        onFieldDelete={handleFieldDelete}
        onFieldsReorder={handleFieldsReorder}
        onIndexTypeChange={handleIndexTypeChange}
        getFieldIndexType={getFieldIndexType}
        getRelationTypeText={getRelationTypeText}
        getTargetSchemaDescription={getTargetSchemaDescription}
        getEnumDescription={getEnumDescription}
      />
    );
  };

  // 树选择器的搜索过滤函数
  const treeFilter = (inputValue: string, node: any) => {
    return node.title.toLowerCase().includes(inputValue.toLowerCase()) ||
           node.value.toLowerCase().includes(inputValue.toLowerCase());
  };

  // 级联选择器的变更处理函数
  const handleEnumChange: CascaderProps<EnumTreeNode>['onChange'] = (_, selectedOptions) => {
    if (selectedOptions && selectedOptions.length > 0) {
      const lastOption = selectedOptions[selectedOptions.length - 1];
      if (lastOption.isLeaf && lastOption.rawEnum) {
        const selectedEnum = lastOption.rawEnum;
        setSelectedEnumId(selectedEnum.code);
        setEnumDisplayText(`${selectedEnum.code}（${selectedEnum.description || selectedEnum.name}）`);
        fieldForm.setFieldValue('targetEnumCode', selectedEnum.code);
      }
    }
  };

  // 级联选择器的搜索过滤函数
  const enumFilter = (inputValue: string, path: DefaultOptionType[]) => {
    return path.some(option => {
      const label = option.label as string;
      const value = option.value as string;
      const searchStr = inputValue.toLowerCase();
      return (
        label.toLowerCase().includes(searchStr) ||
        value.toLowerCase().includes(searchStr)
      );
    });
  };

  // 处理树节点禁用逻辑
  const processTreeData = (nodes: SchemaTreeItem[], currentCode: string): SchemaTreeItem[] => {
    return nodes.map(node => {
      const newNode = { ...node };
      // 如果节点的值与当前数据模型的代码相同，则禁用该节点
      if (newNode.code === currentCode) {
        newNode.disabled = true;
      }
      // 如果有子节点，递归处理
      if (newNode.children) {
        newNode.children = processTreeData(newNode.children, currentCode);
      }
      return newNode;
    });
  };

  // 在编辑字段时设置选中路径和显示文本
  useEffect(() => {
    if (editingField && editingField.type === 'enum' && editingField.enumConfig) {
      const selectedEnum = enums.find(e => e.code === editingField.enumConfig?.targetEnumCode);
      if (selectedEnum) {
        setSelectedEnumId(selectedEnum.code);
        setEnumDisplayText(`${selectedEnum.code}（${selectedEnum.description || selectedEnum.name}）`);
      }
    }
  }, [editingField, enums]);

  // 处理字段编辑时的表单数据设置
  const handleEditField = (field: Field) => {
    setEditingField(field);
    
    // 设置字段类型状态，确保表单能正确显示对应的配置项
    setFieldType(field.type);
    
    // 设置基础字段值
    const formData: any = {
      name: field.name,
      type: field.type,
      description: field.description,
      required: field.required,
      // isPrimaryKey: field.isPrimaryKey, // 暂时注释，等待前端更新
      ...(field.type === 'string' && { length: (field as API.StringField).length }),
      ...(field.type === 'date' && { dateType: (field as API.DateField).dateConfig?.dateType })
    };

    // 根据字段类型设置特定的配置
    switch (field.type) {
      case 'number':
        if (field.numberConfig) {
          formData.numberType = field.numberConfig.numberType;
          formData.precision = field.numberConfig.precision;
          formData.scale = field.numberConfig.scale;
        }
        break;
      case 'date':
        if (field.dateConfig) {
          formData.dateType = field.dateConfig.dateType;
        }
        break;
      case 'enum':
        if (field.enumConfig) {
          formData.targetEnumCode = field.enumConfig.targetEnumCode;
          formData.multiple = field.enumConfig.multiple;
          formData.defaultValues = field.enumConfig.defaultValues;
        }
        break;
      case 'relation':
        if (field.relationConfig) {
          formData.targetSchema = field.relationConfig.targetSchemaCode;
          formData.targetField = field.relationConfig.targetField;
          formData.cascadeDelete = field.relationConfig.cascadeDelete;
          formData.displayFields = field.relationConfig.displayFields;
          // 根据multiple设置relationType
          if (field.relationConfig.multiple) {
            formData.relationType = 'oneToMany';
          } else {
            formData.relationType = 'oneToOne';
          }
        }
        break;
      case 'media':
        if (field.mediaConfig) {
          formData.mediaConfig = field.mediaConfig;
        }
        break;
      case 'api':
        if (field.apiConfig) {
          formData.apiConfig = field.apiConfig;
        }
        break;
    }

    fieldForm.setFieldsValue(formData);
    setIsFieldModalVisible(true);
  };

  return (
    <div className="f-fullscreen">
      <Splitter style={{ height: "calc(100vh - 57px)" }}>
        <Splitter.Panel defaultSize="50%">
          <div className="f-header">
            <label className="fw-bold">所有模型</label>
            <Space>
              <Tooltip title="导出模型">
                <Button
                  type={isSyncMode ? "primary" : "link"}
                  className='px-1'
                  icon={<ExportOutlined />}
                  onClick={handleSyncModeToggle}
                >
                  {isSyncMode ? "取消导出" : "导出"}
                </Button>
              </Tooltip>
              <Tooltip title="模型图谱">
                <Button
                  type="link"
                  className='px-1'
                  icon={<DeploymentUnitOutlined />}
                  onClick={() => {
                    navigate('/schema-graph');
                  }}
                >
                  图谱
                </Button>
              </Tooltip>
              <Tooltip title="枚举管理">
                <Button
                  type="link"
                  className='px-1'
                  icon={<ProfileOutlined />}
                  onClick={() => setEnumModalVisible(true)}
                >
                  枚举
                </Button>
              </Tooltip>
              <AIButton
                type="primary"
                onClick={() => {
                  setIsAICreateModalVisible(true);
                }}
              >
                AI新建模型
              </AIButton>
              <Tooltip title="手工新建模型">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    schemaForm.resetFields();
                    setIsSchemaModalVisible(true);
                  }}
                />
              </Tooltip>
            </Space>
            
          </div>
          <div
            className="pos-relative overflow-y"
            style={{ height: `calc(100% - ${isSyncMode ? '106px' : '50px'})` }}
          >
            <div className="pb-4">
              <Table
                columns={schemaColumns}
                dataSource={schemaTreeData}
                rowKey="code"
                loading={loading}
                pagination={false}
                showHeader={false}
                size="small"
                expandable={{
                  expandedRowKeys,
                  onExpandedRowsChange: (expandedRows) => {
                    setExpandedRowKeys(expandedRows as string[]);
                  },
                  childrenColumnName: "children",
                  indentSize: 20,
                  expandIcon: ({ expanded, onExpand, record }) => {
                    // 如果是叶子节点（没有子节点），不显示图标
                    if (!record.children?.length) {
                      return null;
                    }
                    return (
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          onExpand(record, e);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {expanded ? <CaretDownOutlined style={{ fontSize: '12px', color: '#666', marginRight: '6px' }} /> : <CaretRightOutlined style={{ fontSize: '12px', color: '#999', marginRight: '6px', marginTop: '2px' }} />}
                      </span>
                    );
                  },
                }}
                onRow={(record: any) => ({
                  onClick: (e) => {
                    // 检查是否点击的是 checkbox 列
                    const target = e.target as HTMLElement;
                    const checkboxCell = target.closest('td');
                    if (checkboxCell && checkboxCell.cellIndex === 0 && isSyncMode) {
                      // 点击的是 checkbox 列，不处理
                      return;
                    }
                    
                    if (record.children?.length) {
                      // 虚拟节点：点击整行展开/折叠
                      const isExpanded = expandedRowKeys.includes(record.code);
                      if (isExpanded) {
                        setExpandedRowKeys(expandedRowKeys.filter(key => key !== record.code));
                      } else {
                        setExpandedRowKeys([...expandedRowKeys, record.code]);
                      }
                    } else {
                      // 叶子节点：选中数据表
                      handleSchemaSelect(record as SchemaListItem);
                    }
                  },
                  className:
                    !record.children?.length && selectedSchema?.id === record.id
                      ? "ant-table-row-selected"
                      : "",
                  style: {
                    cursor: "pointer",
                  },
                })}
              />
            </div>
          </div>
          {/* 底部操作面板 */}
          {isSyncMode && (
            <div 
              style={{ 
                position: 'fixed', 
                bottom: 0, 
                left: 0, 
                width: '100%',
                background: 'rgb(38 105 191 / 17%)',
                borderTop: '1px solid rgb(240 240 240 / 5%)',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                backdropFilter: 'blur(10px)',
                alignItems: 'center',
                zIndex: 1000
              }}
            >
              <Space>
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                >
                  全选
                </Checkbox>
                <span>已选择 {selectedRowKeys.length} 个数据模型</span>
              </Space>
              <Button
                type="primary"
                icon={<CloudDownloadOutlined />}
                onClick={handleDownloadORMClick}
                disabled={selectedRowKeys.length === 0}
              >
                导出Prisma模型
              </Button>
            </div>
          )}
        </Splitter.Panel>
        <Splitter.Panel>
          {
            selectedSchema && (
              <div className="f-header">
                <Space>
                  <span className='fw-bold'>{selectedSchema?.name}</span>
                  {/* { selectedSchema?.description && <span className='me-1'>({selectedSchema?.description})</span> } */}
                  <span className='fw-bold me-2'> 的字段</span>
                  <SchemaValidator
                    fields={selectedSchema?.fields ?? []}
                    schemas={schemas}
                    keyIndexes={selectedSchema?.keyIndexes}
                    enums={enums}
                    isLocked={selectedSchema?.isLocked}
                    onValidationChange={(issues) => {
                      // 可以在这里处理验证结果变化
                      console.log('Schema validation issues:', issues);
                    }}
                    onAutoFix={handleAutoFix}
                  />
                </Space>
                <Space>
                  <AIButton
                    type="default"
                    icon={<RobotOutlined />}
                    // size="small"
                    disabled={selectedSchema.isLocked}
                    onClick={() => setIsAIAssistModalVisible(true)}
                  >
                    AI 优化
                  </AIButton>
                  <Tooltip title="新建字段">
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      shape="circle"
                      disabled={selectedSchema.isLocked}
                      // ghost
                      // size="small"
                      onClick={() => {
                        setEditingField(null);
                        fieldForm.resetFields();
                        setIsFieldModalVisible(true);
                      }}
                    />
                  </Tooltip>
                </Space>
              </div>
            )
          }
          <div
            className="pos-relative overflow-y"
            style={{ height: "calc( 100% - 50px)" }}
          >
            <div className="pb-4">{renderFieldList()}</div>
          </div>
        </Splitter.Panel>
      </Splitter>

      {/* 数据模型创建/编辑模态框 */}
      <Modal
        title={selectedSchema ? "编辑数据模型" : "新建数据模型"}
        open={isSchemaModalVisible}
        onOk={() => schemaForm.submit()}
        onCancel={() => setIsSchemaModalVisible(false)}
      >
        <Form form={schemaForm} layout="vertical" onFinish={handleSchemaCreate}>
          <Form.Item
            name="name"
            label="名称"
            rules={[
              { required: true, message: "请输入名称" },
              {
                pattern: /^[a-z][a-z0-9_]*$/,
                message:
                  "名称必须以小写字母开头，只能包含小写字母、数字和下划线",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="code"
            label="代码"
            rules={[
              { required: true, message: "请输入代码" },
              {
                pattern: /^[a-zA-Z][a-zA-Z0-9_:]*$/,
                message: "代码必须以字母开头，只能包含字母、数字、下划线和冒号",
              },
            ]}
          >
            <Input placeholder="例如：system:user" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            name="isActive"
            label="状态"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 字段创建/编辑模态框 */}
      <Modal
        title={editingField ? "编辑字段" : "新建字段"}
        open={isFieldModalVisible}
        onOk={() => fieldForm.submit()}
        onCancel={() => {
          setIsFieldModalVisible(false);
          setFieldType("");
          fieldForm.resetFields();
        }}
        width={720}
      >
        <Form
          form={fieldForm}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
          onFinish={(values: any) => {
            if (editingField) {
              const index =
                selectedSchema?.fields.findIndex(
                  (f) => f.id === editingField.id
                ) ?? -1;
              if (index !== -1) {
                handleFieldEdit(values, index);
              }
            } else {
              handleFieldCreate(values);
            }
          }}
        >
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select onChange={(value: any) => {
              // 当类型改变时，重置相关字段
              fieldForm.resetFields(['length', 'dateType', 'enumConfig', 'relationConfig', 'mediaConfig', 'apiConfig']);
              setFieldType(value);
              setNumberType('');
            }}>
              {fieldTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="字段名"
            rules={[{ validator: validateFieldName }]}
          >
            <Input placeholder="请输入字段名，必须以小写字母开头" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input placeholder="请输入字段描述" />
          </Form.Item>

          <Form.Item
            name="required"
            valuePropName="checked"
            label="是否必填"
          >
            <Switch />
          </Form.Item>

          {/* UUID和自增长ID类型特有的配置 - 暂时注释，等待前端更新 */}
          {/* {(fieldType === 'uuid' || fieldType === 'auto_increment') && (
            <Form.Item
              name="isPrimaryKey"
              valuePropName="checked"
              label="是否主键"
            >
              <Switch />
            </Form.Item>
          )} */}

          {/* 普通字段的通用配置（排除UUID和自增长ID） */}
          {!['uuid', 'auto_increment'].includes(fieldType) && (
            <>
              {/* 字符串类型特有的配置 */}
              {fieldType === 'string' && (
                <Form.Item
                  name="length"
                  label="长度"
                  rules={[{ required: true, message: '请输入字符串长度' }]}
                >
                  <InputNumber min={1} max={255} />
                </Form.Item>
              )}

              {/* 数字类型特有的配置 */}
              {fieldType === 'number' && (
                <>
                  <Form.Item
                    name="numberType"
                    label="数字类型"
                    rules={[{ required: true, message: '请选择数字类型' }]}
                  >
                    <Select onChange={(value: any) => {
                      setNumberType(value);
                      if (value === 'integer') {
                        fieldForm.setFieldsValue({ precision: undefined, scale: undefined });
                      }
                    }}>
                      <Option value="integer">整数</Option>
                      <Option value="float">浮点数</Option>
                      <Option value="decimal">精确小数</Option>
                    </Select>
                  </Form.Item>
                  {(numberType === 'float' || numberType === 'decimal') && (
                    <>
                      <Form.Item
                        name="precision"
                        label="精度"
                        tooltip="数字的总位数，包括整数部分和小数部分"
                        rules={[{ required: true, message: '请输入精度' }]}
                      >
                        <InputNumber min={1} max={65} />
                      </Form.Item>
                      <Form.Item
                        name="scale"
                        label="小数位数"
                        tooltip="小数点后的位数，必须小于精度"
                        rules={[
                          { required: true, message: '请输入小数位数' },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const precision = getFieldValue('precision');
                              if (value > precision) {
                                return Promise.reject('小数位数不能大于精度');
                              }
                              return Promise.resolve();
                            },
                          }),
                        ]}
                      >
                        <InputNumber min={0} max={30} />
                      </Form.Item>
                    </>
                  )}
                </>
              )}

              {/* 日期类型特有的配置 */}
              {fieldType === 'date' && (
                <Form.Item
                  name="dateType"
                  label="日期格式"
                  rules={[{ required: true, message: '请选择日期格式' }]}
                >
                  <Select>
                    <Option value="year">年</Option>
                    <Option value="year-month">年月</Option>
                    <Option value="date">年月日</Option>
                    <Option value="datetime">年月日时间</Option>
                  </Select>
                </Form.Item>
              )}

              {/* 枚举类型特有的配置 */}
              {fieldType === 'enum' && (
                <>
                  <Form.Item
                    name="targetEnumCode"
                    label="选择枚举"
                    rules={[{ required: true, message: '请选择枚举' }]}
                  >
                    <div>
                      <span style={{ marginRight: 8 }}>{enumDisplayText || '未选择'}</span>
                      <Cascader<EnumTreeNode>
                        options={enumTreeData}
                        onChange={handleEnumChange}
                        placeholder="请选择枚举"
                        showSearch={{ filter: enumFilter }}
                      >
                        <a>选择枚举</a>
                      </Cascader>
                    </div>
                  </Form.Item>
                  <Form.Item
                    name="multiple"
                    valuePropName="checked"
                    label="允许多选"
                  >
                    <Switch />
                  </Form.Item>
                </>
              )}

              {/* 关联类型特有的配置 */}
              {fieldType === 'relation' && (
                <>
                  <Form.Item
                    name="relationType"
                    label="关系类型"
                    rules={[{ required: true, message: '请选择关系类型' }]}
                    tooltip={{
                      title: (
                        <div>
                          <p>一对一：每条记录只能关联一条目标记录（如：用户-用户详情）</p>
                          <p>一对多：每条记录可以关联多条目标记录（如：部门-员工）</p>
                          <p>多对一：多条记录可以关联同一条目标记录（如：员工-部门）</p>
                          <p>多对多：双向多条记录关联（如：用户-角色）</p>
                        </div>
                      ),
                    }}
                  >
                    <Select>
                      <Option value="oneToOne">一对一 (1:1)</Option>
                      <Option value="oneToMany">一对多 (1:n)</Option>
                      <Option value="manyToOne">多对一 (n:1)</Option>
                      <Option value="manyToMany">多对多 (m:n)</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="targetSchema"
                    label="目标模型"
                    rules={[{ required: true, message: '请选择目标模型' }]}
                    tooltip={{
                      title: '不能选择当前正在编辑的数据模型作为关联目标'
                    }}
                  >
                    <TreeSelect
                      treeData={processTreeData(schemaTreeData, selectedSchema?.code || '').map(node => ({
                        title: node.name,
                        value: node.code,
                        disabled: node.disabled,
                        children: node.children?.map(child => ({
                          title: child.name,
                          value: child.code,
                          disabled: child.disabled,
                          children: child.children?.map(grandChild => ({
                            title: grandChild.name,
                            value: grandChild.code,
                            disabled: grandChild.disabled,
                            isLeaf: !grandChild.children?.length
                          }))
                        }))
                      }))}
                      placeholder="请选择目标模型"
                      allowClear
                      showSearch
                      treeNodeFilterProp="title"
                      filterTreeNode={treeFilter}
                      treeDefaultExpandAll
                      onChange={(value) => {
                        console.log('选择的目标模型:', value);
                        // 清空关联字段的选择
                        fieldForm.setFieldValue('targetField', undefined);
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="targetField"
                    label="关联字段"
                    tooltip={{
                      title: (
                        <div>
                          <p>选择目标模型中用于关联的字段</p>
                          <p>- 默认使用主键（id 字段）</p>
                          <p>- 也可以选择其他唯一标识字段（如：商品编码、员工工号等）</p>
                          <p>- 支持字符串和数字类型的字段</p>
                        </div>
                      ),
                    }}
                  >
                    <Select
                      placeholder="请选择关联字段"
                      allowClear
                      showSearch
                    >
                      {schemas.find(s => s.code === fieldForm.getFieldValue('targetSchema'))?.fields.map(field => (
                        <Option 
                          key={field.name} 
                          value={field.name}
                          disabled={!isValidRelationField(field)}
                        >
                          {field.name}
                          {field.description ? ` (${field.description})` : ''}
                          {/* {isPrimaryKeyField(field) ? ' [主键]' : ''} */}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="cascadeDelete"
                    label="关联删除策略"
                    rules={[{ required: true, message: '请选择关联删除策略' }]}
                    tooltip={{
                      title: (
                        <div>
                          <p>限制删除：如果存在关联记录，则禁止删除</p>
                          <p>级联删除：删除时同时删除关联记录</p>
                          <p>设置为空：删除时将关联记录的关联字段设为空</p>
                        </div>
                      ),
                    }}
                  >
                    <Select>
                      <Option value="restrict">限制删除</Option>
                      <Option value="cascade">级联删除</Option>
                      <Option value="setNull">设置为空</Option>
                    </Select>
                  </Form.Item>
                </>
              )}

              {/* 媒体类型特有的配置 */}
              {fieldType === 'media' && (
                <>
                  <Form.Item
                    name={['mediaConfig', 'mediaType']}
                    label="媒体类型"
                    rules={[{ required: true, message: '请选择媒体类型' }]}
                  >
                    <Select>
                      <Option value="image">图片</Option>
                      <Option value="video">视频</Option>
                      <Option value="audio">音频</Option>
                      <Option value="document">文档</Option>
                      <Option value="file">文件</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name={['mediaConfig', 'multiple']}
                    valuePropName="checked"
                    label="允许多选"
                  >
                    <Switch />
                  </Form.Item>
                  <Form.Item
                    name={['mediaConfig', 'maxSize']}
                    label="最大文件大小(MB)"
                  >
                    <InputNumber min={1} />
                  </Form.Item>
                  <Form.Item
                    name={['mediaConfig', 'formats']}
                    label="允许的文件格式"
                  >
                    <Select mode="tags" placeholder="请输入允许的文件格式，如: jpg, png">
                      <Option value="jpg">jpg</Option>
                      <Option value="png">png</Option>
                      <Option value="pdf">pdf</Option>
                      <Option value="doc">doc</Option>
                      <Option value="docx">docx</Option>
                    </Select>
                  </Form.Item>
                </>
              )}

              {/* API类型特有的配置 */}
              {fieldType === 'api' && (
                <>
                  <Form.Item
                    name={['apiConfig', 'endpoint']}
                    label="API接口地址"
                    rules={[{ required: true, message: '请输入API接口地址' }]}
                  >
                    <Input placeholder="请输入API接口地址" />
                  </Form.Item>
                  <Form.Item
                    name={['apiConfig', 'method']}
                    label="请求方法"
                    rules={[{ required: true, message: '请选择请求方法' }]}
                  >
                    <Select>
                      <Option value="GET">GET</Option>
                      <Option value="POST">POST</Option>
                      <Option value="PUT">PUT</Option>
                      <Option value="DELETE">DELETE</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name={['apiConfig', 'multiple']}
                    valuePropName="checked"
                    label="允许多选"
                  >
                    <Switch />
                  </Form.Item>
                </>
              )}
            </>
          )}
        </Form>
      </Modal>

      {/* 枚举选择模态框 */}
      <Modal
        title="选择枚举"
        open={isEnumModalVisible}
        onOk={() => {
          if (selectedEnumId) {
            fieldForm.setFieldValue("targetEnumCode", selectedEnumId);
            setIsEnumModalVisible(false);
          } else {
            message.warning("请选择一个枚举");
          }
        }}
        onCancel={() => {
          setIsEnumModalVisible(false);
          setEnumSearchValue("");
        }}
        width={720}
      >
        <Input.Search
          placeholder="搜索枚举"
          value={enumSearchValue}
          onChange={(e) => setEnumSearchValue(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <List
          dataSource={filteredEnums}
          size="small"
          renderItem={(item: any) => (
            <List.Item
              onClick={() => setSelectedEnumId(item.code)}
              style={{
                cursor: "pointer",
                backgroundColor:
                  selectedEnumId === item.code ? "#e6f7ff" : undefined,
              }}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <span>{item.name}</span>
                    <Tag color="blue">{item.code}</Tag>
                    {!item.isActive && <Tag color="red">已禁用</Tag>}
                  </Space>
                }
                description={item.description}
              />
              <div>
                {item.options?.map((option: any) => (
                  <Tag key={option.value}>{option.label}</Tag>
                ))}
              </div>
            </List.Item>
          )}
        />
      </Modal>

      {/* AI 新建模型模态框 */}
      <AICreateSchema
        open={isAICreateModalVisible}
        onCancel={() => setIsAICreateModalVisible(false)}
        onSuccess={handleAICreateSchema}
      />

      {/* AI 协助模态框 */}
              <AIAssistModal
          open={isAIAssistModalVisible}
          onCancel={() => setIsAIAssistModalVisible(false)}
          selectedSchema={selectedSchema}
          onFieldOptimize={handleFieldOptimize}
          isLocked={selectedSchema?.isLocked}
        />

      {/* 枚举管理模态框 */}
      <EnumManagement
        visible={enumModalVisible}
        onClose={() => setEnumModalVisible(false)}
      />
    </div>
  );
};

export default SchemaManagement; 