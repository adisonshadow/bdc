import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, message, Modal, Form, Input, Select, List, Flex, InputNumber, Badge, Popconfirm, Card, Descriptions, Timeline, Checkbox, Divider, Tree, Tabs, Splitter } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, DatabaseOutlined, ClockCircleOutlined, CloudServerOutlined } from '@ant-design/icons';
import { getDatabaseConnections, postDatabaseConnections, deleteDatabaseConnectionsId, postDatabaseConnectionsIdTest, putDatabaseConnectionsId } from '@/services/BDC/api/databaseConnections';
import { postMaterializeTables } from '@/services/BDC/api/materializeTables';
import { getSchemas } from '@/services/BDC/api/schemaManagement';
import { buildTree } from '@/utils/treeBuilder';
import DatabaseTables from '@/components/DatabaseTables';

const { Option } = Select;

interface SyncRecord {
  id: string;
  connectionId: string;
  connectionName: string;
  operation: 'create' | 'update' | 'delete' | 'test' | 'materialize';
  status: 'success' | 'failed' | 'pending';
  message: string;
  timestamp: string;
  details?: any;
  failureDetails?: string;
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
  fields: any[];
}

// 表结构树构建配置
const schemaTreeConfig = {
  getLabel: (item: SchemaListItem, part: string, isLeaf: boolean) => {
    return isLeaf ? `${part}（${item?.description || ''}）` : part;
  },
  buildExtraProps: (item: SchemaListItem, path: string, isLeaf: boolean) => ({
    rawSchema: isLeaf ? item : undefined,
    fields: isLeaf ? item?.fields : undefined,
    key: path // 确保每个节点都有唯一的key
  }),
  getIsActive: (item: SchemaListItem, isLeaf: boolean) => isLeaf ? !!item?.isActive : true
};

const DatabaseManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<API.DatabaseConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<API.DatabaseConnection | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isMaterializeModalVisible, setIsMaterializeModalVisible] = useState(false);
  const [editingConnection, setEditingConnection] = useState<API.DatabaseConnection | null>(null);
  const [connectionForm] = Form.useForm();
  const [materializeForm] = Form.useForm();
  const [syncRecords, setSyncRecords] = useState<SyncRecord[]>([]);
  const [schemas, setSchemas] = useState<SchemaListItem[]>([]);
  const [selectedSchemas, setSelectedSchemas] = useState<string[]>([]);
  const [materializeLoading, setMaterializeLoading] = useState(false);
  const [schemaTreeData, setSchemaTreeData] = useState<any[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(false);
  const [previewSchema, setPreviewSchema] = useState<SchemaListItem | null>(null);

  // 数据库类型选项
  const databaseTypes = [
    { label: 'PostgreSQL', value: 'postgresql' },
    { label: 'MySQL', value: 'mysql' },
    { label: 'MongoDB', value: 'mongodb' },
    { label: 'SQL Server', value: 'sqlserver' },
    { label: 'Oracle', value: 'oracle' }
  ];

  // 处理数据库类型变化
  const handleDatabaseTypeChange = (type: string) => {
    // 根据数据库类型设置默认值
    switch (type) {
      case 'postgresql':
        connectionForm.setFieldsValue({
          port: 5432,
          schema: 'public'
        });
        break;
      case 'mysql':
        connectionForm.setFieldsValue({
          port: 3306,
          schema: undefined
        });
        break;
      case 'mongodb':
        connectionForm.setFieldsValue({
          port: 27017,
          schema: undefined
        });
        break;
      case 'sqlserver':
        connectionForm.setFieldsValue({
          port: 1433,
          schema: undefined
        });
        break;
      case 'oracle':
        connectionForm.setFieldsValue({
          port: 1521,
          schema: undefined
        });
        break;
    }
  };

  // 获取数据库连接列表
  const fetchConnections = async () => {
    setLoading(true);
    try {
      const response = await getDatabaseConnections({
        page: 1,
        limit: 100
      });
      if (response.success && response.data) {
        setConnections(response.data.items || []);
      }
    } catch (error) {
      message.error('获取数据库连接列表失败');
    }
    setLoading(false);
  };

  // 获取表结构列表
  const fetchSchemas = async () => {
    try {
      const response = await getSchemas({});
      console.log('获取到的原始表结构数据:', response);
      
      // 过滤并转换数据以确保类型匹配
      const validSchemas = (response || []).filter(schema => 
        schema.name && schema.code && schema.fields
      ).map(schema => ({
        id: schema.id,
        name: schema.name!,
        code: schema.code!,
        description: schema.description,
        isActive: true, // 默认值
        version: 1, // 默认值
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        fields: schema.fields || []
      }));
      
      console.log('过滤后的有效表结构数据:', validSchemas);
      setSchemas(validSchemas);
      
      // 构建树形数据
      const treeData = buildTree(validSchemas, schemaTreeConfig);
      console.log('构建的树形数据:', treeData);
      setSchemaTreeData(treeData);
      
      // 设置默认展开所有节点
      const allKeys: string[] = [];
      const collectKeys = (nodes: any[]) => {
        nodes.forEach(node => {
          allKeys.push(node.value);
          if (node.children) {
            collectKeys(node.children);
          }
        });
      };
      collectKeys(treeData);
      setExpandedKeys(allKeys);
    } catch (error) {
      console.error('获取表结构列表失败:', error);
      message.error('获取表结构列表失败');
    }
  };



  // 测试连接
  const handleTestConnection = async (connection: API.DatabaseConnection) => {
    try {
      const response = await postDatabaseConnectionsIdTest({ id: connection.id! });
      if (response.success) {
        message.success('连接测试成功');
        // 添加同步记录
        addSyncRecord({
          id: crypto.randomUUID(),
          connectionId: connection.id!,
          connectionName: connection.name,
          operation: 'test',
          status: 'success',
          message: '连接测试成功',
          timestamp: new Date().toISOString()
        });
        
        // 刷新连接列表并更新选中的连接
        const updatedResponse = await getDatabaseConnections({
          page: 1,
          limit: 100
        });
        if (updatedResponse.success && updatedResponse.data) {
          const updatedConnections = updatedResponse.data.items || [];
          setConnections(updatedConnections);
          
          // 更新选中的连接状态
          const updatedConnection = updatedConnections.find(c => c.id === connection.id);
          if (updatedConnection && selectedConnection?.id === connection.id) {
            setSelectedConnection(updatedConnection);
          }
        }
      }
    } catch (error: any) {
      message.error(`连接测试失败: ${error.response?.data?.message || error.message}`);
      // 添加失败的同步记录
      addSyncRecord({
        id: crypto.randomUUID(),
        connectionId: connection.id!,
        connectionName: connection.name,
        operation: 'test',
        status: 'failed',
        message: error.response?.data?.message || error.message,
        timestamp: new Date().toISOString()
      });
    }
  };

  // 添加同步记录
  const addSyncRecord = (record: SyncRecord) => {
    setSyncRecords(prev => [record, ...prev.slice(0, 99)]); // 保留最近100条记录
  };

  // 创建数据库连接
  const handleCreateConnection = async (values: any) => {
    try {
      const response = await postDatabaseConnections(values);
      if (response.success) {
        message.success('创建成功');
        
        // 显示警告信息（如果有）
        if (response.data && 'warnings' in response.data && Array.isArray((response.data as any).warnings) && (response.data as any).warnings.length > 0) {
          (response.data as any).warnings.forEach((warning: string) => {
            message.warning(warning);
          });
        }
        
        setIsCreateModalVisible(false);
        connectionForm.resetFields();
        fetchConnections();
        // 添加同步记录
        addSyncRecord({
          id: crypto.randomUUID(),
          connectionId: response.data?.id || '',
          connectionName: values.name,
          operation: 'create',
          status: 'success',
          message: '数据库连接创建成功',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      message.error(`创建失败: ${error.response?.data?.message || error.message}`);
    }
  };

  // 更新数据库连接
  const handleUpdateConnection = async (values: any) => {
    if (!editingConnection?.id) {
      message.error('编辑的连接信息不完整');
      return;
    }

    // 如果密码为空，则不包含在更新数据中
    const updateData = { ...values };
    if (!updateData.password || updateData.password.trim() === '') {
      delete updateData.password;
    }

    try {
      const response = await putDatabaseConnectionsId(
        { id: editingConnection.id },
        updateData
      );
      
      if (response.success) {
        message.success('更新成功');
        
        // 显示警告信息（如果有）
        if (response.data && 'warnings' in response.data && Array.isArray((response.data as any).warnings) && (response.data as any).warnings.length > 0) {
          (response.data as any).warnings.forEach((warning: string) => {
            message.warning(warning);
          });
        }
        
        setIsEditModalVisible(false);
        connectionForm.resetFields();
        setEditingConnection(null);
        fetchConnections();
        
        // 如果当前选中的连接被编辑了，更新选中状态
        if (selectedConnection?.id === editingConnection.id) {
          setSelectedConnection(response.data || null);
        }
        
        // 添加同步记录
        addSyncRecord({
          id: crypto.randomUUID(),
          connectionId: editingConnection.id,
          connectionName: values.name,
          operation: 'update',
          status: 'success',
          message: '数据库连接更新成功',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      message.error(`更新失败: ${error.response?.data?.message || error.message}`);
      
      // 添加失败的同步记录
      addSyncRecord({
        id: crypto.randomUUID(),
        connectionId: editingConnection.id,
        connectionName: editingConnection.name,
        operation: 'update',
        status: 'failed',
        message: error.response?.data?.message || error.message,
        timestamp: new Date().toISOString()
      });
    }
  };

  // 删除数据库连接
  const handleDeleteConnection = async (id: string) => {
    try {
      const connection = connections.find(c => c.id === id);
      await deleteDatabaseConnectionsId({ id });
      message.success('删除成功');
      if (selectedConnection?.id === id) {
        setSelectedConnection(null);
      }
      fetchConnections();
      // 添加同步记录
      if (connection) {
        addSyncRecord({
          id: crypto.randomUUID(),
          connectionId: id,
          connectionName: connection.name,
          operation: 'delete',
          status: 'success',
          message: '数据库连接删除成功',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      message.error(`删除失败: ${error.response?.data?.message || error.message}`);
    }
  };

  // 获取状态标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'testing': return 'processing';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '活跃';
      case 'inactive': return '未激活';
      case 'testing': return '测试中';
      case 'failed': return '失败';
      default: return '未知';
    }
  };

  // 获取数据库类型标签颜色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'postgresql': return 'blue';
      case 'mysql': return 'orange';
      case 'mongodb': return 'green';
      case 'sqlserver': return 'purple';
      case 'oracle': return 'red';
      default: return 'default';
    }
  };

  // 处理表同步
  const handleMaterializeTables = async (values: any) => {
    console.log('=== 开始同步 ===');
    console.log('同步参数:', { 
      selectedSchemas, 
      selectedSchemasLength: selectedSchemas.length,
      checkedKeys, 
      checkedKeysLength: checkedKeys.length,
      isAllSelected, 
      isIndeterminate 
    });
    console.log('selectedSchemas 内容:', selectedSchemas);
    
    if (selectedSchemas.length === 0) {
      console.log('selectedSchemas 为空，显示警告');
      message.warning('请选择要同步的表结构');
      return;
    }

    setMaterializeLoading(true);
    try {
      const response = await postMaterializeTables({
        connectionId: selectedConnection!.id!,
        schemaCodes: selectedSchemas,
        config: {
          overwrite: values.overwrite,
          includeIndexes: values.includeIndexes,
          includeConstraints: values.includeConstraints,
          targetSchema: values.targetSchema,
          tablePrefix: values.tablePrefix
        }
      });

      if (response.success) {
        message.success('表同步成功');
        
        // 添加同步记录
        const successCount = response.results?.filter(r => r.success).length || 0;
        const failCount = response.results?.filter(r => !r.success).length || 0;
        
        // 构建详细的失败信息
        const failedResults = response.results?.filter(r => !r.success) || [];
        const failureDetails = failedResults.map(r => 
          `${r.schemaCode}: ${r.message || r.error || '未知错误'}`
        ).join('\n');
        
        addSyncRecord({
          id: crypto.randomUUID(),
          connectionId: selectedConnection!.id!,
          connectionName: selectedConnection!.name,
          operation: 'materialize',
          status: failCount === 0 ? 'success' : 'failed',
          message: `成功同步 ${successCount} 个表${failCount > 0 ? `，失败 ${failCount} 个表` : ''}`,
          timestamp: new Date().toISOString(),
          details: response.results,
          failureDetails: failCount > 0 ? failureDetails : undefined
        });

        setIsMaterializeModalVisible(false);
        materializeForm.resetFields();
        setSelectedSchemas([]);
      }
    } catch (error: any) {
      message.error(`表同步失败: ${error.response?.data?.message || error.message}`);
      
      // 添加失败的同步记录
      addSyncRecord({
        id: crypto.randomUUID(),
        connectionId: selectedConnection!.id!,
        connectionName: selectedConnection!.name,
        operation: 'materialize',
        status: 'failed',
        message: error.response?.data?.message || error.message,
        timestamp: new Date().toISOString()
      });
    }
    setMaterializeLoading(false);
  };

  // 处理全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    console.log('handleSelectAll called with checked:', checked);
    if (checked) {
      // 全选：获取所有叶子节点的key和code
      const allLeafKeys: string[] = [];
      const allLeafCodes: string[] = [];
      
      const collectLeafKeysAndCodes = (nodes: any[]) => {
        nodes.forEach(node => {
          if (node.children && node.children.length > 0) {
            collectLeafKeysAndCodes(node.children);
          } else {
            // 只有叶子节点才添加到选中列表
            const nodeKey = node.key || node.value;
            allLeafKeys.push(nodeKey);
            if (node.rawSchema) {
              allLeafCodes.push(node.rawSchema.code);
              console.log('找到叶子节点:', { key: nodeKey, code: node.rawSchema.code });
            } else {
              console.log('叶子节点但没有rawSchema:', { key: nodeKey, node });
            }
          }
        });
      };
      
      collectLeafKeysAndCodes(schemaTreeData);
      console.log('收集到的叶子节点keys:', allLeafKeys);
      console.log('收集到的叶子节点codes:', allLeafCodes);
      
      // 同时更新两个状态
      setCheckedKeys(allLeafKeys);
      setSelectedSchemas(allLeafCodes);
    } else {
      // 取消全选
      setCheckedKeys([]);
      setSelectedSchemas([]);
    }
  };

  // 检查是否全选
  const checkSelectionStatus = () => {
    const allLeafKeys: string[] = [];
    const collectLeafKeys = (nodes: any[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          collectLeafKeys(node.children);
        } else {
          allLeafKeys.push(node.key || node.value);
        }
      });
    };
    collectLeafKeys(schemaTreeData);
    
    const selectedLeafKeys = checkedKeys.filter(key => 
      allLeafKeys.includes(key)
    );
    
    setIsAllSelected(allLeafKeys.length > 0 && selectedLeafKeys.length === allLeafKeys.length);
    setIsIndeterminate(selectedLeafKeys.length > 0 && selectedLeafKeys.length < allLeafKeys.length);
  };

  // 监听checkedKeys变化，更新全选状态
  useEffect(() => {
    checkSelectionStatus();
  }, [checkedKeys, schemaTreeData]);

  // 监听selectedSchemas变化，用于调试
  useEffect(() => {
    console.log('selectedSchemas changed:', selectedSchemas);
  }, [selectedSchemas]);



  useEffect(() => {
    fetchConnections();
    fetchSchemas();
  }, []);

  // 渲染字段预览列表
  const renderFieldPreview = () => {
    if (!previewSchema) {
      return (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          请选择左侧的表结构查看字段详情
        </div>
      );
    }

    // 获取关系类型显示文本
    const getRelationTypeText = (field: any) => {
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
      if (!enumCode) return enumCode || '';
      return enumCode;
    };

    return (
      <div style={{ padding: '6px 16px 16px 16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: 0 }}>{previewSchema.name}
          {previewSchema.description && (
            <span style={{ color: '#666', fontSize: '12px', marginLeft: '14px' }}>
              {previewSchema.description}
            </span>
          )}
          </h4>
        </div>
        <List
          dataSource={previewSchema.fields}
          size="small"
          renderItem={(field: any, index: number) => (
            <List.Item
              key={field.id || index}
              className="px-0"
            >
              <List.Item.Meta
                title={
                  <Space>
                    <span>{field.name}</span>
                    {field.description && <span>({field.description})</span>}
                    <Tag color="blue">{field.type}</Tag>
                    {/* 主键标识 - 暂时注释，等待前端更新 */}
                    {/* {(field.type === 'uuid' || field.type === 'auto_increment') && field.isPrimaryKey && (
                      <Tag color="red">PK</Tag>
                    )} */}
                  </Space>
                }
                description={
                  <div style={{ marginTop: '4px' }}>
                    {/* 必填 */}
                    {field.required && <Tag color="cyan" bordered={false}>必填</Tag>}
                    {/* 长度 */}
                    {field.type === 'string' && field.length && (
                      <Tag color="cyan" bordered={false}>
                        VARCHAR({field.length})
                      </Tag>
                    )}
                    {/* 长文本 */}
                    {field.type === 'text' && (
                      <Tag color="cyan" bordered={false}>
                        TEXT
                      </Tag>
                    )}
                    {/* 日期 */}
                    {field.type === 'date' && field.dateConfig?.dateType && (
                      <Tag color="cyan" bordered={false}>{field.dateConfig.dateType}</Tag>
                    )}
                    {/* 枚举 */}
                    {field.type === 'enum' && field.enumConfig && (
                      <>
                        <Tag color="cyan" bordered={false}>
                          枚举: {getEnumDescription(field.enumConfig?.targetEnumCode)}
                        </Tag>
                        {field.enumConfig?.multiple && (
                          <Tag color="purple" bordered={false}>允许多选</Tag>
                        )}
                      </>
                    )}
                    {/* 关联 */}
                    {field.type === 'relation' && field.relationConfig && (
                      <>
                        <Tag color="cyan" bordered={false}>
                          {getRelationTypeText(field)}
                        </Tag>
                        <Tag color="cyan" bordered={false}>
                          关联: {getTargetSchemaDescription(field.relationConfig?.targetSchemaCode)}
                        </Tag>
                      </>
                    )}
                    {/* 媒体 */}
                    {field.type === 'media' && field.mediaConfig && (
                      <Tag color="cyan" bordered={false}>媒体类型: {field.mediaConfig?.mediaType}</Tag>
                    )}
                    {/* API */}
                    {field.type === 'api' && field.apiConfig && (
                      <Tag color="cyan" bordered={false}>API: {field.apiConfig?.endpoint}</Tag>
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

  const connectionColumns = [
    {
      title: '连接名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: API.DatabaseConnection) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          {record.description && (
            <div style={{ color: '#666', fontSize: '12px' }}>{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: '数据库类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>{type.toUpperCase()}</Tag>
      ),
    },
    {
      title: '连接信息',
      key: 'connection',
      hidden: true,
      render: (record: API.DatabaseConnection) => (
        <div style={{ fontSize: '12px' }}>
          <div>{record.host}:{record.port}</div>
          <div>{record.database}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: API.DatabaseConnection) => (
        <Space>
          <Badge 
            status={record.lastTestSuccess ? 'success' : 'error'} 
            text={getStatusText(status)}
          />
          {record.lastTestSuccess && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
          {!record.lastTestSuccess && record.lastTestAt && <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      fixed: 'right',
      render: (record: API.DatabaseConnection) => (
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation(); // 阻止行点击事件
            setEditingConnection(record);
            // 设置表单值，但不包含密码字段
            const formData = { ...record } as any;
            if ('password' in formData) {
              delete formData.password; // 编辑时不显示原密码
            }
            connectionForm.setFieldsValue(formData);
            setIsEditModalVisible(true);
          }}
        />
      ),
    },
  ];

  return (
    <div className="f-fullscreen">
      <Splitter style={{ height: "calc(100vh - 57px)" }}>
        <Splitter.Panel defaultSize="50%">
          <div className="f-header">
            <label className="fw-bold">数据库连接</label>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                connectionForm.resetFields();
                setIsCreateModalVisible(true);
              }}
            >
              新建数据库连接
            </Button>
          </div>
          <div
            className="pos-relative overflow-y"
            style={{ height: "calc(100% - 50px)" }}
          >
            <div className="pb-4">
              <Table
                columns={connectionColumns as any}
                dataSource={connections}
                rowKey="id"
                loading={loading}
                pagination={false}
                size="small"
                onRow={(record) => ({
                  onClick: () => setSelectedConnection(record),
                  className: selectedConnection?.id === record.id ? "ant-table-row-selected" : "",
                  style: { cursor: "pointer" },
                })}
              />
            </div>
          </div>
        </Splitter.Panel>
        <Splitter.Panel>
          <div
            className="pos-relative overflow-y"
            style={{ height: "calc(100% - 50px)" }}
          >
            <div className="pb-4">
              {selectedConnection ? (
                <Tabs
                  defaultActiveKey="connection"
                  centered
                  style={{ height: '100%' }}
                  items={[
                    {
                      key: 'connection',
                      label: '连接信息',
                      children: (
                        <div style={{ padding: '16px' }}>
                          <Space style={{ marginBottom: 16 }}>
                            <Button
                              type="primary"
                              size="small"
                              icon={<SyncOutlined />}
                              onClick={() => handleTestConnection(selectedConnection)}
                              loading={selectedConnection.status === 'testing'}
                            >
                              测试连接
                            </Button>
                            <Popconfirm
                              title="删除数据库连接"
                              description={`确定要删除 "${selectedConnection.name}" 吗？此操作不可恢复。`}
                              onConfirm={() => handleDeleteConnection(selectedConnection.id!)}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Button
                                type="primary"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                              >
                                删除连接
                              </Button>
                            </Popconfirm>
                          </Space>
                          <Card title="连接详情">
                            <Descriptions column={1} size="small">
                              <Descriptions.Item label="连接名称">{selectedConnection.name}</Descriptions.Item>
                              <Descriptions.Item label="数据库类型">
                                <Tag color={getTypeColor(selectedConnection.type)}>
                                  {selectedConnection.type.toUpperCase()}
                                </Tag>
                              </Descriptions.Item>
                              <Descriptions.Item label="主机地址">{selectedConnection.host}:{selectedConnection.port}</Descriptions.Item>
                              <Descriptions.Item label="数据库名">{selectedConnection.database}</Descriptions.Item>
                              <Descriptions.Item label="用户名">{selectedConnection.username}</Descriptions.Item>
                              <Descriptions.Item label="状态">
                                <Badge 
                                  status={selectedConnection.lastTestSuccess ? 'success' : 'error'} 
                                  text={getStatusText(selectedConnection.status || 'inactive')}
                                />
                              </Descriptions.Item>
                              {selectedConnection.lastTestAt && (
                                <Descriptions.Item label="最后测试时间">
                                  {new Date(selectedConnection.lastTestAt).toLocaleString()}
                                </Descriptions.Item>
                              )}
                            </Descriptions>
                          </Card>
                        </div>
                      ),
                    },
                    {
                      key: 'sync',
                      label: '同步',
                      children: (
                        <div style={{ padding: '16px' }}>
                          {!selectedConnection.lastTestSuccess ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                              <SyncOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                              <div>请先完成测试连接</div>
                            </div>
                          ) : (
                            <>
                              <Space style={{ marginBottom: 16 }}>
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<CloudServerOutlined />}
                                  onClick={() => {
                                    setIsMaterializeModalVisible(true);
                                    materializeForm.resetFields();
                                    setSelectedSchemas([]);
                                    setCheckedKeys([]);
                                    setIsAllSelected(false);
                                    setIsIndeterminate(false);
                                    setPreviewSchema(null);
                                  }}
                                >
                                  同步
                                </Button>
                              </Space>
                              <Card title="同步记录">
                                <Timeline>
                                  {syncRecords
                                    .filter(record => record.connectionId === selectedConnection.id)
                                    .map(record => (
                                      <Timeline.Item
                                        key={record.id}
                                        color={record.status === 'success' ? 'green' : record.status === 'failed' ? 'red' : 'blue'}
                                        dot={record.operation === 'test' ? <SyncOutlined /> : <DatabaseOutlined />}
                                      >
                                        <div>
                                          <div style={{ fontWeight: 'bold' }}>
                                            {record.operation === 'create' && '创建连接'}
                                            {record.operation === 'update' && '更新连接'}
                                            {record.operation === 'delete' && '删除连接'}
                                            {record.operation === 'test' && '测试连接'}
                                            {record.operation === 'materialize' && '表同步'}
                                          </div>
                                          <div style={{ color: '#666', fontSize: '12px' }}>
                                            {record.message}
                                          </div>
                                          {record.failureDetails && (
                                            <div style={{ 
                                              color: '#ff4d4f', 
                                              fontSize: '11px', 
                                              marginTop: '4px',
                                              backgroundColor: '#fff2f0',
                                              padding: '4px 8px',
                                              borderRadius: '4px',
                                              border: '1px solid #ffccc7',
                                              whiteSpace: 'pre-line'
                                            }}>
                                              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>失败详情：</div>
                                              {record.failureDetails}
                                            </div>
                                          )}
                                          <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                                            {new Date(record.timestamp).toLocaleString()}
                                          </div>
                                        </div>
                                      </Timeline.Item>
                                    ))}
                                  {syncRecords.filter(record => record.connectionId === selectedConnection.id).length === 0 && (
                                    <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                                      暂无同步记录
                                    </div>
                                  )}
                                </Timeline>
                              </Card>
                            </>
                          )}
                        </div>
                      ),
                    },
                    {
                      key: 'tables',
                      label: '库表结构',
                      children: (
                        <div style={{ padding: '16px' }}>
                          <DatabaseTables 
                            connectionId={selectedConnection?.id}
                            lastTestSuccess={selectedConnection?.lastTestSuccess}
                          />
                        </div>
                      ),
                    },
                  ]}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  请选择左侧的数据库连接查看详细信息
                </div>
              )}
            </div>
          </div>
        </Splitter.Panel>
      </Splitter>

      {/* 创建数据库连接模态框 */}
      <Modal
        title="新建数据库连接"
        open={isCreateModalVisible}
        onOk={() => connectionForm.submit()}
        onCancel={() => setIsCreateModalVisible(false)}
        width={600}
        maskClosable={false}
      >
        <Form
          form={connectionForm}
          layout="vertical"
          onFinish={handleCreateConnection}
        >
          <Form.Item
            name="name"
            label="连接名称"
            rules={[{ required: true, message: '请输入连接名称' }]}
          >
            <Input placeholder="请输入连接名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="连接描述"
          >
            <Input.TextArea placeholder="请输入连接描述" />
          </Form.Item>

          <Form.Item
            name="type"
            label="数据库类型"
            rules={[{ required: true, message: '请选择数据库类型' }]}
          >
            <Select 
              placeholder="请选择数据库类型"
              onChange={handleDatabaseTypeChange}
            >
              {databaseTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="host"
            label="主机地址"
            rules={[{ required: true, message: '请输入主机地址' }]}
          >
            <Input placeholder="localhost" />
          </Form.Item>

          <Form.Item
            name="port"
            label="端口号"
            rules={[{ required: true, message: '请输入端口号' }]}
          >
            <InputNumber 
              placeholder="5432" 
              style={{ width: '100%' }}
              min={1}
              max={65535}
            />
          </Form.Item>

          <Form.Item
            name="database"
            label="数据库名称"
            rules={[{ required: true, message: '请输入数据库名称' }]}
          >
            <Input placeholder="请输入数据库名称" />
          </Form.Item>

          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: false, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码（可选）" />
          </Form.Item>

          <Form.Item
            name="schema"
            label="Schema名称"
          >
            <Input placeholder="public" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑数据库连接模态框 */}
      <Modal
        title="编辑数据库连接"
        open={isEditModalVisible}
        onOk={() => connectionForm.submit()}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingConnection(null);
          connectionForm.resetFields();
        }}
        width={600}
        maskClosable={false}
      >
        <Form
          form={connectionForm}
          layout="vertical"
          onFinish={handleUpdateConnection}
        >
          <Form.Item
            name="name"
            label="连接名称"
            rules={[{ required: true, message: '请输入连接名称' }]}
          >
            <Input placeholder="请输入连接名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="连接描述"
          >
            <Input.TextArea placeholder="请输入连接描述" />
          </Form.Item>

          <Form.Item
            name="type"
            label="数据库类型"
            rules={[{ required: true, message: '请选择数据库类型' }]}
          >
            <Select 
              placeholder="请选择数据库类型"
              onChange={handleDatabaseTypeChange}
              disabled={true} // 编辑时不允许修改数据库类型
            >
              {databaseTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="host"
            label="主机地址"
            rules={[{ required: true, message: '请输入主机地址' }]}
          >
            <Input placeholder="localhost" />
          </Form.Item>

          <Form.Item
            name="port"
            label="端口号"
            rules={[{ required: true, message: '请输入端口号' }]}
          >
            <InputNumber 
              placeholder="5432" 
              style={{ width: '100%' }}
              min={1}
              max={65535}
            />
          </Form.Item>

          <Form.Item
            name="database"
            label="数据库名称"
            rules={[{ required: true, message: '请输入数据库名称' }]}
          >
            <Input placeholder="请输入数据库名称" />
          </Form.Item>

          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: false, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入新密码（留空则不修改）" />
          </Form.Item>

          <Form.Item
            name="schema"
            label="Schema名称"
          >
            <Input placeholder="public" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 表同步模态框 */}
      <Modal
        title="将模型同步到数据库"
        open={isMaterializeModalVisible}
        onOk={() => materializeForm.submit()}
        onCancel={() => {
          setIsMaterializeModalVisible(false);
          setPreviewSchema(null);
        }}
        width={1000}
        maskClosable={false}
        confirmLoading={materializeLoading}
        style={{ top: 20 }}
      >
        <Form
          form={materializeForm}
          layout="vertical"
          onFinish={handleMaterializeTables}
          initialValues={{
            overwrite: false,
            includeIndexes: true,
            includeConstraints: true,
            targetSchema: selectedConnection?.schema || 'public',
            tablePrefix: ''
          }}
        >
          <div style={{ 
                height: '300px',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: '#424242',
                borderRadius: 6,
                background: '#141414',
                marginBottom: '16px'
            }}>
            <Splitter style={{ height: '100%' }}>
              <Splitter.Panel defaultSize="40%">
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', margin: '4px 8px 12px 8px' }}>
                      <h4 style={{ margin: 0, marginRight: '8px' }}>选择要同步的表</h4>
                      <Checkbox
                        checked={isAllSelected}
                        indeterminate={isIndeterminate}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      >
                        全选
                      </Checkbox>
                    </div>
                  </div>
                  <div style={{ 
                    flex: 1,
                    overflowY: 'auto', 
                    borderRadius: '6px'
                  }}>
                    <Tree
                      checkable
                      showIcon
                      treeData={schemaTreeData}
                      expandedKeys={expandedKeys}
                      checkedKeys={checkedKeys}
                      // height={300}
                      fieldNames={{ key: 'value', title: 'label' }}
                      onExpand={(expandedKeysValue) => {
                        setExpandedKeys(expandedKeysValue as string[]);
                      }}
                      onCheck={(checkedKeysValue) => {
                        const keys = Array.isArray(checkedKeysValue) ? checkedKeysValue : checkedKeysValue.checked;
                        console.log('Tree onCheck - keys:', keys);
                        setCheckedKeys(keys as string[]);
                        // 只收集叶子节点的code
                        const leafCodes: string[] = [];
                        const collectLeafCodes = (nodes: any[], checkedKeys: string[]) => {
                          nodes.forEach(node => {
                            const nodeKey = node.key || node.value;
                            console.log('Tree onCheck - 检查节点:', { nodeKey, hasChildren: !!(node.children && node.children.length > 0), hasRawSchema: !!node.rawSchema });
                            if (checkedKeys.includes(nodeKey)) {
                              if (node.children && node.children.length > 0) {
                                collectLeafCodes(node.children, checkedKeys);
                              } else {
                                // 只有叶子节点才添加到选中列表
                                if (node.rawSchema) {
                                  console.log('Tree onCheck - 找到叶子节点:', node.rawSchema.code);
                                  leafCodes.push(node.rawSchema.code);
                                } else {
                                  console.log('Tree onCheck - 叶子节点但没有rawSchema:', node);
                                }
                              }
                            }
                          });
                        };
                        collectLeafCodes(schemaTreeData, keys as string[]);
                        console.log('Tree onCheck - leafCodes:', leafCodes);
                        setSelectedSchemas(leafCodes);
                      }}
                      onSelect={(selectedKeys, info) => {
                        // 当点击树节点时，预览对应的表结构
                        if (info.node.rawSchema) {
                          setPreviewSchema(info.node.rawSchema);
                        } else {
                          setPreviewSchema(null);
                        }
                      }}
                      titleRender={(node) => (
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{node.label}
                          {node.rawSchema && (
                            <span style={{ color: '#666', fontSize: '12px' }}>
                              字段数: {node.rawSchema.fields?.length || 0}
                            </span>
                          )}
                          </div>
                        </div>
                      )}
                    />
                    {schemaTreeData.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                        暂无表结构定义
                      </div>
                    )}
                  </div>
                </div>
              </Splitter.Panel>
              <Splitter.Panel>
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* <div style={{ height: '32px', display: 'flex', alignItems: 'center' }}>
                    <h4 style={{ margin: 0 }}>字段预览</h4>
                  </div> */}
                  <div style={{ 
                    flex: 1,
                    overflowY: 'auto',
                    borderRadius: '6px',
                  }}>
                    {renderFieldPreview()}
                  </div>
                </div>
              </Splitter.Panel>
            </Splitter>
          </div>

          <Form.Item
            name="targetSchema"
            label="目标Schema"
            rules={[{ required: true, message: '请输入目标Schema名称' }]}
          >
            <Input placeholder="public" />
          </Form.Item>

          <Form.Item
            name="tablePrefix"
            label="表名前缀"
          >
            <Input placeholder="可选，为空则使用原表名" />
          </Form.Item>

          <Form.Item
            name="overwrite"
            valuePropName="checked"
          >
            <Checkbox>覆盖已存在的表</Checkbox>
          </Form.Item>

          <Form.Item
            name="includeIndexes"
            valuePropName="checked"
          >
            <Checkbox>包含索引</Checkbox>
          </Form.Item>

          <Form.Item
            name="includeConstraints"
            valuePropName="checked"
          >
            <Checkbox>包含约束</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DatabaseManagement; 