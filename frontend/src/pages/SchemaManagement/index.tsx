import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Space, Tag, Tooltip, Switch, message, Modal, Form, Input, Select, List, Flex, InputNumber, Cascader, TreeSelect, Badge, Popconfirm } from 'antd';
import type { CascaderProps } from 'antd';
import type { DefaultOptionType } from 'antd/es/cascader';
import { PlusOutlined, EditOutlined, DeleteOutlined, CloudServerOutlined, MoreOutlined, ApartmentOutlined, SyncOutlined } from '@ant-design/icons';
import { Splitter } from 'antd';
import { getSchemas, putSchemasId, postSchemas, deleteSchemasId } from '@/services/BDC/api/schemaManagement';
import { getEnums } from '@/services/BDC/api/enumManagement';
import { buildTree, enumTreeConfig } from '@/utils/treeBuilder';
import { EnumTreeNode } from '@/types/enum';
import SchemaValidator from '@/components/SchemaValidator';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

// 判断字段是否可以用作关联字段
const isValidRelationField = (field: Field) => {
  // 可以用作唯一标识的字段类型
  if (field.type === 'string' || field.type === 'number') {
    return true;
  }
  return false;
};

// 判断字段是否是主键
const isPrimaryKeyField = (field: Field) => {
  return field.type === 'string' && field.name === 'id';
};

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
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  fields: Field[];
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
            isPrimaryKey: fieldData.isPrimaryKey,
            length: fieldData.length,
            dateType: fieldData.dateType
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
                type: 'string'
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
                type: 'number'
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
                type: 'date'
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
                  multiple: fieldData.multiple,
                  cascadeDelete: fieldData.cascadeDelete,
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
          version: itemData.version,
          createdAt: itemData.createdAt,
          updatedAt: itemData.updatedAt,
          fields
        };
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

  const handleSchemaDelete = async (id: string) => {
    if (!id) return;
    try {
      await deleteSchemasId({ id });
      message.success('删除成功');
      if (selectedSchema?.id === id) {
        setSelectedSchema(null);
      }
      fetchSchemas();
    } catch (error) {
      message.error('删除失败');
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
        isPrimaryKey: values.isPrimaryKey,
        length: values.length,
        dateType: values.dateType
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
            type: 'number'
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
            type: 'date'
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
        isPrimaryKey: values.isPrimaryKey,
        length: values.length,
        dateType: values.dateType
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
            type: 'number'
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
            type: 'date'
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

      console.log('更新后的字段:', updatedField);

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

  // 处理同步到数据库
  const handleSyncToDatabase = () => {
    // TODO: 实现同步逻辑
    message.info('同步功能待实现');
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

  const schemaColumns = [
    {
      title: 'code',
      dataIndex: 'code',
      key: 'code',
      render: (text: string, record: SchemaTreeItem) => {
        // 获取当前层级的名称（最后一个冒号后的部分）
        const currentLevelName = text.split(':').pop() || '';
        return <span style={{ color: record.children?.length ? '#999' : undefined }}>{currentLevelName}</span>;
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
      width: 80,
      render: (_: unknown, record: SchemaTreeItem) => {
        // 只有叶子节点显示操作按钮
        if (record.children?.length) return null;
        return (
          <Flex justify='end'>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                schemaForm.setFieldsValue(record);
                setIsSchemaModalVisible(true);
              }}
            />
            <Popconfirm
              title="删除数据表"
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
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </Flex>
        );
      },
    },
  ];

  const renderFieldList = () => {
    if (!selectedSchema) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          请选择左侧的数据表
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

    // 获取目标数据表的描述信息
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
      <div style={{ padding: '16px' }}>
        <List
          dataSource={selectedSchema.fields}
          size="small"
          renderItem={(field: Field, index: number) => (
            <List.Item
              key={field.id || index}
              className="px-0"
              actions={[
                <Button
                  key="edit"
                  type="link"
                  icon={<EditOutlined />}
                  shape='circle'
                  onClick={() => {
                    handleEditField(field);
                  }}
                />,
                <Popconfirm
                  key="delete"
                  title="删除字段"
                  description={`确定要删除字段 "${field.name}" 吗？此操作不可恢复。`}
                  onConfirm={() => handleFieldDelete(index)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    type="link"
                    shape='circle'
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <span>{field.name}</span>
                    {field.description && <span>({field.description})</span>}
                    <Tag color="blue">{field.type}</Tag>
                    {(field.type === 'uuid' || field.type === 'auto_increment') && field.isPrimaryKey && (
                      <Tag color="red">PK</Tag>
                    )}
                  </Space>
                }
                description={
                  <div style={{ marginTop: '4px' }}>
                    {/* 必填 */}
                    {field.required && <Tag color="cyan" bordered={false}>必填</Tag>}
                    {/* 长度 */}
                    {field.type === 'string' && (field as API.StringField).length && (
                      <Tag color="cyan" bordered={false}>
                        VARCHAR({(field as API.StringField).length})
                      </Tag>
                    )}
                    {/* 长文本 */}
                    {field.type === 'text' && (
                      <Tag color="cyan" bordered={false}>
                        TEXT
                      </Tag>
                    )}
                    {/* 日期 */}
                    {field.type === 'date' && (field as API.DateField).dateType && (
                      <Tag color="cyan" bordered={false}>{(field as API.DateField).dateType}</Tag>
                    )}
                    {/* 枚举 */}
                    {field.type === 'enum' && (field as API.EnumField).enumConfig && (
                      <>
                        <Tag color="cyan" bordered={false}>
                          枚举: {getEnumDescription((field as API.EnumField).enumConfig?.targetEnumCode)}
                        </Tag>
                        {(field as API.EnumField).enumConfig?.multiple && (
                          <Tag color="purple" bordered={false}>允许多选</Tag>
                        )}
                      </>
                    )}
                    {/* 关联 */}
                    {field.type === 'relation' && (field as API.RelationField).relationConfig && (
                      <>
                        <Tag color="cyan" bordered={false}>
                          {getRelationTypeText(field as ExtendedRelationField)}
                        </Tag>
                        <Tag color="cyan" bordered={false}>
                          关联: {getTargetSchemaDescription((field as API.RelationField).relationConfig?.targetSchemaCode)}
                        </Tag>
                      </>
                    )}
                    {/* 媒体 */}
                    {field.type === 'media' && (field as API.MediaField).mediaConfig && (
                      <Tag color="cyan" bordered={false}>媒体类型: {(field as API.MediaField).mediaConfig?.mediaType}</Tag>
                    )}
                    {/* API */}
                    {field.type === 'api' && (field as API.ApiField).apiConfig && (
                      <Tag color="cyan" bordered={false}>API: {(field as API.ApiField).apiConfig?.endpoint}</Tag>
                    )}
                    {/* 数字类型 */}
                    {field.type === 'number' && (
                      <Tag color="cyan" bordered={false}>数字</Tag>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>
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
      // 如果节点的值与当前数据表的代码相同，则禁用该节点
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
      isPrimaryKey: field.isPrimaryKey,
      length: field.length,
      dateType: field.dateType
    };

    // 根据字段类型设置特定的配置
    switch (field.type) {
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
        <Splitter.Panel defaultSize="40%">
          <div className="f-header">
            <label className="fw-bold">数据表</label>
            <Space>
              <Button
                type={isSyncMode ? "primary" : "link"}
                ghost={!isSyncMode}
                icon={<CloudServerOutlined />}
                onClick={handleSyncModeToggle}
              >
                {isSyncMode ? "取消同步" : "开始同步"}
              </Button>
              <Button
                type="link"
                ghost
                icon={<ApartmentOutlined />}
                onClick={() => {
                  navigate('/schema-graph');
                }}
              >
                图谱
              </Button>
              <Button
                type="primary"
                ghost
                icon={<PlusOutlined />}
                onClick={() => {
                  schemaForm.resetFields();
                  setIsSchemaModalVisible(true);
                }}
              >
                新建表
              </Button>
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
                rowSelection={isSyncMode ? {
                  selectedRowKeys,
                  onChange: (selectedKeys) => {
                    setSelectedRowKeys(selectedKeys as string[]);
                  },
                  getCheckboxProps: (record: SchemaTreeItem) => ({
                    disabled: !!record.children?.length, // 禁用非叶子节点的选择
                  }),
                } : undefined}
                expandable={{
                  expandedRowKeys,
                  onExpandedRowsChange: (expandedRows) => {
                    setExpandedRowKeys(expandedRows as string[]);
                  },
                  childrenColumnName: "children",
                  indentSize: 20,
                }}
                onRow={(record: any) => ({
                  onClick: () => {
                    // 只有叶子节点可以选中
                    if (!record.children?.length) {
                      handleSchemaSelect(record as SchemaListItem);
                    }
                  },
                  className:
                    !record.children?.length && selectedSchema?.id === record.id
                      ? "ant-table-row-selected"
                      : "",
                  style: {
                    cursor: record.children?.length ? "default" : "pointer",
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
                background: 'rgb(25 25 25 / 17%)',
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
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                <span>已选择 {selectedRowKeys.length} 个数据表</span>
              </Space>
              <Button
                type="primary"
                icon={<SyncOutlined />}
                onClick={handleSyncToDatabase}
                disabled={selectedRowKeys.length === 0}
              >
                同步
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
                  { selectedSchema?.description && <span className='me-1'>({selectedSchema?.description})</span> }
                  <span className='fw-bold me-2'> 的数据表字段</span>
                  <SchemaValidator
                    fields={selectedSchema?.fields ?? []}
                    schemas={schemas}
                  />
                </Space>
                <Tooltip title="新建字段">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    shape="circle"
                    ghost={true}
                    size="small"
                    onClick={() => {
                      setEditingField(null);
                      fieldForm.resetFields();
                      setIsFieldModalVisible(true);
                    }}
                  />
                </Tooltip>
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

      {/* 数据表创建/编辑模态框 */}
      <Modal
        title={selectedSchema ? "编辑数据表" : "新建数据表"}
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

          {/* UUID和自增长ID类型特有的配置 */}
          {(fieldType === 'uuid' || fieldType === 'auto_increment') && (
            <Form.Item
              name="isPrimaryKey"
              valuePropName="checked"
              label="是否主键"
            >
              <Switch />
            </Form.Item>
          )}

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
                    label="目标数据表"
                    rules={[{ required: true, message: '请选择目标数据表' }]}
                    tooltip={{
                      title: '不能选择当前正在编辑的数据表作为关联目标'
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
                      placeholder="请选择目标数据表"
                      allowClear
                      showSearch
                      treeNodeFilterProp="title"
                      filterTreeNode={treeFilter}
                      treeDefaultExpandAll
                      onChange={(value) => {
                        console.log('选择的目标数据表:', value);
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
                          <p>选择目标数据表中用于关联的字段</p>
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
                          {isPrimaryKeyField(field) ? ' [主键]' : ''}
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
    </div>
  );
};

export default SchemaManagement; 