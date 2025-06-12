import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card, Table, Button, Space, Tag, Tooltip, Switch, message, Modal, Form, Input, Select, List, Radio, InputNumber, Cascader } from 'antd';
import type { CascaderProps } from 'antd';
import type { DefaultOptionType } from 'antd/es/cascader';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Splitter } from 'antd';
import { getSchemas, putSchemasId, postSchemas, deleteSchemasId } from '@/services/BDC/api/schemaManagement';
import { getEnums } from '@/services/BDC/api/enumManagement';

const { Option } = Select;

const buildEnumTree = (enums: API.Enum[]): API.EnumTreeNode[] => {
  const treeMap = new Map<string, API.EnumTreeNode>();
  const rootNodes: API.EnumTreeNode[] = [];

  // 首先，将所有枚举转换为树节点
  enums.forEach(item => {
    if (!item.id || !item.code || !item.name) return; // 跳过无效数据
    
    const parts = item.code.split(':');
    let currentPath = '';
    
    // 为每一级创建节点
    parts.forEach((part, index) => {
      const path = index === 0 ? part : `${currentPath}:${part}`;
      currentPath = path;
      
      if (!treeMap.has(path)) {
        const isLeaf = index === parts.length - 1;
        const matchedEnum = isLeaf ? item : enums.find(e => e.code === path);
        const node: API.EnumTreeNode = {
          value: path,
          label: isLeaf ? `${part}（${matchedEnum?.description || ''}）` : part,
          children: [],
          id: isLeaf ? item.id : `temp_${path}`,
          isActive: isLeaf ? !!item.isActive : true,
          description: isLeaf ? item.description : undefined,
          options: isLeaf ? item.options : undefined,
          rawEnum: isLeaf ? item : undefined
        };

        treeMap.set(path, node);
        
        if (index === 0) {
          rootNodes.push(node);
        } else {
          const parentPath = parts.slice(0, index).join(':');
          const parentNode = treeMap.get(parentPath);
          if (parentNode) {
            if (!parentNode.children) {
              parentNode.children = [];
            }
            parentNode.children.push(node);
          }
        }
      }
    });
  });

  // 清理没有子节点的 children 数组
  const cleanupEmptyChildren = (nodes: API.EnumTreeNode[]) => {
    nodes.forEach(node => {
      if (node.children && node.children.length === 0) {
        delete node.children;
      } else if (node.children) {
        cleanupEmptyChildren(node.children);
      }
    });
  };
  
  cleanupEmptyChildren(rootNodes);
  return rootNodes;
};

type Field = API.StringField | API.TextField | API.NumberField | API.DateField | API.EnumField | API.RelationField | API.MediaField | API.ApiField;

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
  const [stringType, setStringType] = useState<string>('');
  const [dateType, setDateType] = useState<string>('');
  const [enums, setEnums] = useState<API.Enum[]>([]);
  const [enumTreeData, setEnumTreeData] = useState<API.EnumTreeNode[]>([]);
  const [selectedEnumPath, setSelectedEnumPath] = useState<string[]>([]);
  const [isEnumModalVisible, setIsEnumModalVisible] = useState(false);
  const [enumSearchValue, setEnumSearchValue] = useState('');
  const [selectedEnumId, setSelectedEnumId] = useState<string>();
  const [enumDisplayText, setEnumDisplayText] = useState<string>('');

  // 字段类型选项
  const fieldTypes = [
    { label: 'UUID', value: 'uuid' },
    { label: '自增长ID', value: 'auto-increment' },
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

  // 字符串类型选项
  const stringTypes = [
    { label: '短文本 (varchar)', value: 'varchar' },
    { label: '长文本 (text)', value: 'text' },
  ];

  // 日期类型选项
  const dateTypes = [
    { label: '年', value: 'year' },
    { label: '年月', value: 'year-month' },
    { label: '年月日', value: 'date' },
    { label: '年月日时间', value: 'datetime' },
  ];

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
            isRequired: fieldData.isRequired,
            defaultValue: fieldData.defaultValue
          };

          switch (fieldData.type) {
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
                type: 'text',
                maxLength: fieldData.maxLength
              };
              return typedField;
            }
            case 'number': {
              const typedField: API.NumberField = {
                ...baseField,
                type: 'number',
                numberType: fieldData.numberType,
                precision: fieldData.precision,
                scale: fieldData.scale
              };
              return typedField;
            }
            case 'date': {
              const typedField: API.DateField = {
                ...baseField,
                type: 'date',
                dateType: fieldData.dateType,
                useNowAsDefault: fieldData.useNowAsDefault
              };
              return typedField;
            }
            case 'enum': {
              const typedField: API.EnumField = {
                ...baseField,
                type: 'enum',
                enumId: fieldData.enumId,
                multiple: fieldData.multiple,
                defaultValues: fieldData.defaultValues
              };
              return typedField;
            }
            case 'relation': {
              const typedField: API.RelationField = {
                ...baseField,
                type: 'relation',
                targetSchema: fieldData.targetSchema,
                targetField: fieldData.targetField,
                multiple: fieldData.multiple,
                cascadeDelete: fieldData.cascadeDelete,
                displayFields: fieldData.displayFields
              };
              return typedField;
            }
            case 'media': {
              const typedField: API.MediaField = {
                ...baseField,
                type: 'media',
                mediaType: fieldData.mediaType,
                formats: fieldData.formats,
                maxSize: fieldData.maxSize,
                multiple: fieldData.multiple
              };
              return typedField;
            }
            case 'api': {
              const typedField: API.ApiField = {
                ...baseField,
                type: 'api',
                endpoint: fieldData.endpoint,
                method: fieldData.method,
                params: fieldData.params,
                headers: fieldData.headers,
                resultMapping: fieldData.resultMapping
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
    } catch (error) {
      message.error('获取数据结构列表失败');
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
      const treeData = buildEnumTree(response);
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
      let newField: Field;
      const baseFieldData = {
        id: crypto.randomUUID(),
        name: values.name,
        type: values.type as API.BaseField['type'],
        description: values.description,
        isRequired: values.isRequired,
        defaultValue: values.defaultValue
      };

      // 根据字段类型创建正确的类型
      switch (values.type) {
        case 'string':
          newField = {
            ...baseFieldData,
            type: 'string',
            length: values.length
          };
          break;
        case 'text':
          newField = {
            ...baseFieldData,
            type: 'text',
            maxLength: values.maxLength
          };
          break;
        case 'number':
          newField = {
            ...baseFieldData,
            type: 'number',
            numberType: values.numberType,
            precision: values.precision,
            scale: values.scale
          };
          break;
        case 'date':
          newField = {
            ...baseFieldData,
            type: 'date',
            dateType: values.dateType,
            useNowAsDefault: values.useNowAsDefault
          };
          break;
        case 'enum':
          newField = {
            ...baseFieldData,
            type: 'enum',
            enumId: values.enumId,
            multiple: values.multiple,
            defaultValues: values.defaultValues
          };
          break;
        case 'relation':
          newField = {
            ...baseFieldData,
            type: 'relation',
            targetSchema: values.targetSchema,
            targetField: values.targetField,
            multiple: values.multiple,
            cascadeDelete: values.cascadeDelete,
            displayFields: values.displayFields
          };
          break;
        case 'media':
          newField = {
            ...baseFieldData,
            type: 'media',
            mediaType: values.mediaType,
            formats: values.formats,
            maxSize: values.maxSize,
            multiple: values.multiple
          };
          break;
        case 'api':
          newField = {
            ...baseFieldData,
            type: 'api',
            endpoint: values.endpoint,
            method: values.method,
            params: values.params,
            headers: values.headers,
            resultMapping: values.resultMapping
          };
          break;
        default:
          throw new Error(`未知的字段类型: ${values.type}`);
      }

      const updatedFields = [...selectedSchema.fields, newField];
      await putSchemasId(
        { id: selectedSchema.id },
        {
          fields: updatedFields
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
    } catch (error) {
      message.error('字段添加失败');
    }
  };

  const handleFieldEdit = async (values: any, index: number) => {
    if (!selectedSchema?.id) return;
    
    try {
      let updatedField: Field;
      const baseFieldData = {
        id: selectedSchema.fields[index].id,
        name: values.name,
        type: values.type as API.BaseField['type'],
        description: values.description,
        isRequired: values.isRequired,
        defaultValue: values.defaultValue
      };

      // 根据字段类型创建正确的类型
      switch (values.type) {
        case 'string':
          updatedField = {
            ...baseFieldData,
            type: 'string',
            length: values.length
          };
          break;
        case 'text':
          updatedField = {
            ...baseFieldData,
            type: 'text',
            maxLength: values.maxLength
          };
          break;
        case 'number':
          updatedField = {
            ...baseFieldData,
            type: 'number',
            numberType: values.numberType,
            precision: values.precision,
            scale: values.scale
          };
          break;
        case 'date':
          updatedField = {
            ...baseFieldData,
            type: 'date',
            dateType: values.dateType,
            useNowAsDefault: values.useNowAsDefault
          };
          break;
        case 'enum':
          updatedField = {
            ...baseFieldData,
            type: 'enum',
            enumId: values.enumId,
            multiple: values.multiple,
            defaultValues: values.defaultValues
          };
          break;
        case 'relation':
          updatedField = {
            ...baseFieldData,
            type: 'relation',
            targetSchema: values.targetSchema,
            targetField: values.targetField,
            multiple: values.multiple,
            cascadeDelete: values.cascadeDelete,
            displayFields: values.displayFields
          };
          break;
        case 'media':
          updatedField = {
            ...baseFieldData,
            type: 'media',
            mediaType: values.mediaType,
            formats: values.formats,
            maxSize: values.maxSize,
            multiple: values.multiple
          };
          break;
        case 'api':
          updatedField = {
            ...baseFieldData,
            type: 'api',
            endpoint: values.endpoint,
            method: values.method,
            params: values.params,
            headers: values.headers,
            resultMapping: values.resultMapping
          };
          break;
        default:
          throw new Error(`未知的字段类型: ${values.type}`);
      }

      const updatedFields = [...selectedSchema.fields];
      updatedFields[index] = updatedField;
      
      await putSchemasId(
        { id: selectedSchema.id },
        {
          fields: updatedFields
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
    } catch (error) {
      message.error('字段更新失败');
    }
  };

  const handleFieldDelete = async (index: number) => {
    if (!selectedSchema?.id) return;
    
    try {
      const updatedFields = selectedSchema.fields.filter((_, i) => i !== index);
      await putSchemasId(
        { id: selectedSchema.id },
        {
          fields: updatedFields
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

  const schemaColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: SchemaListItem) => (
        <div>
          <div style={{ marginBottom: '4px' }}>
            <Space>
              <Tag color={record.isActive ? 'success' : 'error'}>
                {record.isActive ? '启用' : '禁用'}
              </Tag>
              <span>{text}</span>
              <Tag color="blue">{record.code}</Tag>
            </Space>
          </div>
          {record.description && (
            <div style={{ color: '#666', fontSize: '12px' }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: SchemaListItem) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡
              schemaForm.setFieldsValue(record);
              setIsSchemaModalVisible(true);
            }}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡
              handleSchemaDelete(record.id!);
            }}
          />
        </Space>
      ),
    },
  ];

  const renderFieldList = () => {
    if (!selectedSchema) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          请选择左侧的数据结构
        </div>
      );
    }

    return (
      <div style={{ padding: '16px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0 }}>{selectedSchema.name}</h3>
            <div style={{ color: '#666', fontSize: '12px' }}>{selectedSchema.description}</div>
          </div>
          <Tooltip title="新建字段">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              shape='circle'
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
        <List
          dataSource={selectedSchema.fields}
          size="small"
          renderItem={(field, index) => (
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
                    setEditingField(field);
                    fieldForm.setFieldsValue(field);
                    setIsFieldModalVisible(true);
                  }}
                />,
                <Button
                  key="delete"
                  type="link"
                  shape='circle'
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleFieldDelete(index)}
                />,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <span>{field.name}</span>
                    {field.description && <span>({field.description})</span>}
                    <Tag color="blue">{field.type}</Tag>
                  </Space>
                }
                description={
                  <div style={{ marginTop: '4px' }}>
                    {/* 必填 */}
                    {field.isRequired && <Tag color="red" bordered={false}>必填</Tag>}
                    {/* 长度 */}
                    {field.type === 'string' && (field as API.StringField).length && (
                      <Tag color="cyan" bordered={false}>
                        VARCHAR({(field as API.StringField).length})
                      </Tag>
                    )}
                    {/* 长文本 */}
                    {field.type === 'text' && (field as API.TextField).maxLength && (
                      <Tag color="cyan" bordered={false}>
                        TEXT({(field as API.TextField).maxLength})
                      </Tag>
                    )}
                    {/* 日期 */}
                    {field.type === 'date' && (field as API.DateField).dateType && (
                      <Tag color="cyan" bordered={false}>{(field as API.DateField).dateType}</Tag>
                    )}
                    {/* 枚举 */}
                    {field.type === 'enum' && (field as API.EnumField).enumId && (
                      <Tag color="cyan" bordered={false}>枚举ID: {(field as API.EnumField).enumId}</Tag>
                    )}
                    {/* 关联 */}
                    {field.type === 'relation' && (field as API.RelationField).targetSchema && (
                      <Tag color="cyan" bordered={false}>关联: {(field as API.RelationField).targetSchema}</Tag>
                    )}
                    {/* 媒体 */}
                    {field.type === 'media' && (field as API.MediaField).mediaType && (
                      <Tag color="cyan" bordered={false}>媒体类型: {(field as API.MediaField).mediaType}</Tag>
                    )}
                    {/* API */}
                    {field.type === 'api' && (field as API.ApiField).endpoint && (
                      <Tag color="cyan" bordered={false}>API: {(field as API.ApiField).endpoint}</Tag>
                    )}
                    {/* 默认值 */}
                    {field.defaultValue && (
                      <Tag color="orange" bordered={false}>默认值: {field.defaultValue}</Tag>
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

  // 级联选择器的变更处理函数
  const handleEnumChange: CascaderProps<API.EnumTreeNode>['onChange'] = (_, selectedOptions) => {
    if (!selectedOptions?.length) {
      setSelectedEnumId(undefined);
      setEnumDisplayText('');
      fieldForm.setFieldValue('enumId', undefined);
      return;
    }

    const lastOption = selectedOptions[selectedOptions.length - 1] as API.EnumTreeNode;
    if (lastOption?.rawEnum) {
      setSelectedEnumId(lastOption.rawEnum.id);
      fieldForm.setFieldValue('enumId', lastOption.rawEnum.id);
      // 构建显示路径
      const displayPath = selectedOptions.map((opt, index) => {
        const node = opt as API.EnumTreeNode;
        const code = node.value.split(':').pop() || '';
        // 如果是最后一个节点，添加 description
        if (index === selectedOptions.length - 1) {
          return `${code}（${node.rawEnum?.description || ''}）`;
        }
        return code;
      }).join(' / ');
      setEnumDisplayText(displayPath);
    }
  };

  // 级联选择器的搜索处理函数
  const handleEnumSearch = (value: string) => {
    console.log('搜索枚举:', value);
  };

  // 修改枚举字段的表单项渲染
  const renderEnumFormItems = () => (
    <>
      <Form.Item
        name="enumId"
        label="选择枚举"
        rules={[{ required: true, message: '请选择枚举' }]}
      >
        <div>
          <span style={{ marginRight: 8 }}>{enumDisplayText || '未选择'}</span>
          <Cascader<API.EnumTreeNode>
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
  );

  // 在 renderFieldFormItems 函数中使用新的渲染函数
  const renderFieldFormItems = () => {
    const fieldType = fieldForm.getFieldValue('type');

    return (
      <>
        <Form.Item
          name="type"
          label="类型"
          rules={[{ required: true, message: '请选择类型' }]}
        >
          <Select onChange={(value) => {
            // 当类型改变时，重置相关字段
            fieldForm.resetFields(['length', 'maxLength', 'dateType', 'useNowAsDefault', 'enumId', 'mediaType', 'multiple', 'defaultValue']);
            setFieldType(value);
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

        {/* UUID和自增长ID类型特有的配置 */}
        {(fieldType === 'uuid' || fieldType === 'auto-increment') && (
          <Form.Item
            name="isPrimaryKey"
            valuePropName="checked"
            label="是否主键"
          >
            <Switch />
          </Form.Item>
        )}

        {/* 普通字段的通用配置（排除UUID和自增长ID） */}
        {!['uuid', 'auto-increment'].includes(fieldType) && (
          <>
            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea placeholder="请输入字段描述" />
            </Form.Item>

            <Form.Item
              name="isRequired"
              valuePropName="checked"
              label="是否必填"
            >
              <Switch />
            </Form.Item>

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

            {/* 文本类型特有的配置 */}
            {fieldType === 'text' && (
              <Form.Item
                name="maxLength"
                label="最大长度"
              >
                <InputNumber min={1} />
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
                  <Select>
                    <Option value="integer">整数</Option>
                    <Option value="float">浮点数</Option>
                    <Option value="decimal">精确小数</Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  name="precision"
                  label="精度"
                >
                  <InputNumber min={1} />
                </Form.Item>
                <Form.Item
                  name="scale"
                  label="小数位数"
                >
                  <InputNumber min={0} />
                </Form.Item>
              </>
            )}

            {/* 日期类型特有的配置 */}
            {fieldType === 'date' && (
              <>
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
                <Form.Item
                  name="useNowAsDefault"
                  valuePropName="checked"
                  label="使用当前时间作为默认值"
                >
                  <Switch />
                </Form.Item>
              </>
            )}

            {/* 枚举类型特有的配置 */}
            {fieldType === 'enum' && renderEnumFormItems()}

            {/* 关联类型特有的配置 */}
            {fieldType === 'relation' && (
              <>
                <Form.Item
                  name="targetSchema"
                  label="目标数据结构"
                  rules={[{ required: true, message: '请选择目标数据结构' }]}
                >
                  <Select>
                    {schemas.map(schema => (
                      <Option key={schema.id} value={schema.id}>{schema.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="targetField"
                  label="关联字段"
                >
                  <Input placeholder="默认为主键" />
                </Form.Item>
                <Form.Item
                  name="multiple"
                  valuePropName="checked"
                  label="允许多选"
                >
                  <Switch />
                </Form.Item>
                <Form.Item
                  name="cascadeDelete"
                  label="关联删除策略"
                  rules={[{ required: true, message: '请选择关联删除策略' }]}
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
                  name="mediaType"
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
                  name="multiple"
                  valuePropName="checked"
                  label="允许多选"
                >
                  <Switch />
                </Form.Item>
                <Form.Item
                  name="maxSize"
                  label="最大文件大小(MB)"
                >
                  <InputNumber min={1} />
                </Form.Item>
                <Form.Item
                  name="formats"
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
                  name="endpoint"
                  label="API接口地址"
                  rules={[{ required: true, message: '请输入API接口地址' }]}
                >
                  <Input placeholder="请输入API接口地址" />
                </Form.Item>
                <Form.Item
                  name="method"
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
              </>
            )}

            {/* 默认值配置（排除特殊类型） */}
            {!['date', 'enum', 'relation', 'media', 'api'].includes(fieldType) && (
              <Form.Item
                name="defaultValue"
                label="默认值"
              >
                {fieldType === 'boolean' ? (
                  <Switch checkedChildren="是" unCheckedChildren="否" />
                ) : (
                  <Input placeholder="请输入默认值" />
                )}
              </Form.Item>
            )}
          </>
        )}
      </>
    );
  };

  // 在编辑字段时设置选中路径和显示文本
  useEffect(() => {
    if (editingField && editingField.type === 'enum' && editingField.enumId) {
      const selectedEnum = enums.find(e => e.id === editingField.enumId);
      if (selectedEnum) {
        setSelectedEnumId(selectedEnum.id);
        // 构建显示路径
        const pathParts = selectedEnum.code.split(':');
        const displayPath = pathParts.map((part, index) => {
          if (index === pathParts.length - 1) {
            return `${part}（${selectedEnum.description || ''}）`;
          }
          return part;
        }).join(' / ');
        setEnumDisplayText(displayPath);
      }
    } else {
      setSelectedEnumId(undefined);
      setEnumDisplayText('');
    }
  }, [editingField, enums]);

  return (
    <PageContainer>
      <Card bodyStyle={{ padding: 0 }}>
        <Splitter style={{ height: 'calc(100vh - 200px)' }}>
          <Splitter.Panel defaultSize="40%">
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    schemaForm.resetFields();
                    setIsSchemaModalVisible(true);
                  }}
                >
                  新建数据结构
                </Button>
              </div>
              <Table
                columns={schemaColumns}
                dataSource={schemas}
                rowKey="id"
                loading={loading}
                pagination={false}
                size="small"
                onRow={(record) => ({
                  onClick: () => handleSchemaSelect(record),
                  style: {
                    cursor: 'pointer',
                    backgroundColor: selectedSchema?.id === record.id ? '#e6f7ff' : undefined,
                  },
                })}
              />
            </div>
          </Splitter.Panel>
          <Splitter.Panel>
            {renderFieldList()}
          </Splitter.Panel>
        </Splitter>
      </Card>

      {/* 数据结构创建/编辑模态框 */}
      <Modal
        title={selectedSchema ? "编辑数据结构" : "新建数据结构"}
        open={isSchemaModalVisible}
        onOk={() => schemaForm.submit()}
        onCancel={() => setIsSchemaModalVisible(false)}
      >
        <Form
          form={schemaForm}
          layout="vertical"
          onFinish={handleSchemaCreate}
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[
              { required: true, message: '请输入名称' },
              { pattern: /^[a-z][a-z0-9_]*$/, message: '名称必须以小写字母开头，只能包含小写字母、数字和下划线' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="code"
            label="代码"
            rules={[
              { required: true, message: '请输入代码' },
              { pattern: /^[a-zA-Z][a-zA-Z0-9_:]*$/, message: '代码必须以字母开头，只能包含字母、数字、下划线和冒号' }
            ]}
          >
            <Input placeholder="例如：system:user" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
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
        title={editingField ? '编辑字段' : '新建字段'}
        open={isFieldModalVisible}
        onOk={() => fieldForm.submit()}
        onCancel={() => {
          setIsFieldModalVisible(false);
          setFieldType('');
          fieldForm.resetFields();
        }}
        width={720}
      >
        <Form
          form={fieldForm}
          layout="vertical"
          onFinish={(values) => {
            if (editingField) {
              const index = selectedSchema?.fields.findIndex(f => f.id === editingField.id) ?? -1;
              if (index !== -1) {
                handleFieldEdit(values, index);
              }
            } else {
              handleFieldCreate(values);
            }
          }}
        >
          {renderFieldFormItems()}
        </Form>
      </Modal>

      {/* 枚举选择模态框 */}
      <Modal
        title="选择枚举"
        open={isEnumModalVisible}
        onOk={() => {
          console.log('选择枚举:', {
            selectedEnumId,
            selectedEnum: enums.find(e => e.id === selectedEnumId)
          });
          if (selectedEnumId) {
            fieldForm.setFieldValue('enumId', selectedEnumId);
            setIsEnumModalVisible(false);
          } else {
            message.warning('请选择一个枚举');
          }
        }}
        onCancel={() => {
          setIsEnumModalVisible(false);
          setEnumSearchValue('');
        }}
        width={720}
      >
        <Input.Search
          placeholder="搜索枚举"
          value={enumSearchValue}
          onChange={e => {
            // console.log('搜索枚举:', e.target.value);
            setEnumSearchValue(e.target.value);
          }}
          style={{ marginBottom: 16 }}
        />
        <List
          dataSource={enums.filter(e => {
            const matched = !enumSearchValue || 
              e.name.toLowerCase().includes(enumSearchValue.toLowerCase()) ||
              e.code.toLowerCase().includes(enumSearchValue.toLowerCase());
            console.log('枚举过滤:', {
              enum: e,
              searchValue: enumSearchValue,
              matched
            });
            return matched;
          })}
          size="small"
          renderItem={item => (
            <List.Item
              onClick={() => setSelectedEnumId(item.id)}
              style={{ 
                cursor: 'pointer',
                backgroundColor: selectedEnumId === item.id ? '#e6f7ff' : undefined 
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
                {item.options?.map(option => (
                  <Tag key={option.value}>{option.label}</Tag>
                ))}
              </div>
            </List.Item>
          )}
        />
      </Modal>
    </PageContainer>
  );
};

export default SchemaManagement; 