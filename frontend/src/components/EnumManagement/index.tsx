import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Button,
  Input,
  Space,
  Popconfirm,
  message,
  Tag,
  Tooltip,
  Segmented
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { getEnums, deleteEnumsId } from '@/services/BDC/api/enumManagement';
import EnumForm from './EnumForm';
import { buildTree, enumTreeConfig } from '@/utils/treeBuilder';

interface EnumManagementProps {
  visible: boolean;
  onClose: () => void;
}

const EnumManagement: React.FC<EnumManagementProps> = ({ visible, onClose }) => {
  const [enums, setEnums] = useState<API.Enum[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [editingEnum, setEditingEnum] = useState<API.Enum | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 计算Modal尺寸
  const modalWidth = windowSize.width - 40; // 左右各留20px边距
  const modalHeight = windowSize.height - 40; // 上下各留20px边距

  // 获取枚举列表
  const fetchEnums = async () => {
    setLoading(true);
    try {
      const response = await getEnums({});
      setEnums(response || []);
    } catch (error) {
      console.error('获取枚举列表失败:', error);
      message.error('获取枚举列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 过滤枚举列表
  const filteredEnums = enums.filter(enumItem =>
    enumItem.name.toLowerCase().includes(searchText.toLowerCase()) ||
    enumItem.code.toLowerCase().includes(searchText.toLowerCase()) ||
    enumItem.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  // 构建树形数据
  const treeData = buildTree(filteredEnums, enumTreeConfig);

  // 收集所有树节点的key
  const collectAllKeys = (nodes: any[]): string[] => {
    const keys: string[] = [];
    const collect = (nodeList: any[]) => {
      nodeList.forEach(node => {
        keys.push(node.value);
        if (node.children && node.children.length > 0) {
          collect(node.children);
        }
      });
    };
    collect(nodes);
    return keys;
  };

  // 当切换到树形视图时，展开所有节点
  useEffect(() => {
    if (viewMode === 'tree' && treeData.length > 0) {
      setExpandedRowKeys(collectAllKeys(treeData));
    }
  }, [viewMode, treeData]);

  // 处理删除枚举
  const handleDelete = async (id: string) => {
    try {
      await deleteEnumsId({ id });
      message.success('枚举删除成功');
      fetchEnums();
    } catch (error: any) {
      console.error('删除枚举失败:', error);
      const errorMessage = error.response?.data?.message || '删除枚举失败';
      message.error(errorMessage);
    }
  };

  // 处理编辑枚举
  const handleEdit = (record: API.Enum) => {
    setEditingEnum(record);
    setFormVisible(true);
  };

  // 处理添加枚举
  const handleAdd = () => {
    setEditingEnum(null);
    setFormVisible(true);
  };

  // 处理表单成功
  const handleFormSuccess = () => {
    fetchEnums();
  };

  // 处理表单关闭
  const handleFormClose = () => {
    setFormVisible(false);
    setEditingEnum(null);
  };

  // 列表视图的列定义
  const listColumns = [
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code',
      // width: 150,
      render: (text: string) => (
        <Tag color="blue">{text}</Tag>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      // width: 120,
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: any) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '选项数量',
      key: 'optionsCount',
      width: 80,
      render: (record: any) => (
        <Tag color="green">{record.options?.length || 0}</Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (text: any) => text ? new Date(text).toLocaleString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (record: any) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个枚举吗？"
            description="删除后无法恢复，请谨慎操作"
            onConfirm={() => handleDelete(record.id!)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 树形视图的列定义
  const treeColumns = [
    {
      title: '代码',
      dataIndex: 'value',
      key: 'value',
      width: 300,
      render: (text: string, record: any) => {
        // 如果是虚拟节点（有子节点），只显示节点名称
        if (record.children && record.children.length > 0) {
          return <span style={{ fontWeight: 'bold' }}>{record.label}</span>;
        }
        // 如果是叶子节点，显示代码标签
        return <Tag color="blue">{text}</Tag>;
      }
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
      render: (text: any, record: any) => {
        // 只有叶子节点才显示描述
        if (record.children && record.children.length > 0) {
          return null;
        }
        return text;
      }
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: any, record: any) => {
        // 只有叶子节点才显示状态
        if (record.children && record.children.length > 0) {
          return null;
        }
        return (
          <Tag color={isActive ? 'success' : 'default'}>
            {isActive ? '启用' : '禁用'}
          </Tag>
        );
      }
    },
    {
      title: '选项数量',
      key: 'optionsCount',
      width: 80,
      render: (record: any) => {
        // 只有叶子节点才显示选项数量
        if (record.children && record.children.length > 0) {
          return null;
        }
        return <Tag color="green">{record.options?.length || 0}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (record: any) => {
        // 只有叶子节点才显示操作按钮
        if (record.children && record.children.length > 0) {
          return null;
        }
        return (
          <Space size="small">
            <Tooltip title="编辑">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => record.rawEnum && handleEdit(record.rawEnum)}
              />
            </Tooltip>
            <Popconfirm
              title="确定要删除这个枚举吗？"
              description="删除后无法恢复，请谨慎操作"
              onConfirm={() => record.rawEnum && handleDelete(record.rawEnum.id!)}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="删除">
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  useEffect(() => {
    if (visible) {
      fetchEnums();
    }
  }, [visible]);

  return (
    <>
      <Modal
        title="枚举管理"
        open={visible}
        onCancel={onClose}
        width={modalWidth}
        style={{ 
          top: 20,
          paddingBottom: 20,
          maxWidth: 'none',
        }}
        styles={{
          "body": {
            height: modalHeight - 70, // 减去标题栏高度
            padding: '16px',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
        footer={null}
        destroyOnHidden	
      >
        {/* 搜索和操作区域 */}
        <div style={{ 
          marginBottom: 16,
          flexShrink: 0
        }}>
          <div className='d-flex justify-content-between align-items-center'>
            <Space>
              <Segmented
                options={[
                  { label: '列表', value: 'list' },
                  { label: '树形', value: 'tree' }
                ]}
                value={viewMode}
                onChange={(value) => setViewMode(value as 'list' | 'tree')}
              />
              <Input
                placeholder="搜索枚举名称、代码或描述"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
              />
            </Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              添加枚举
            </Button>
          </div>
        </div>

        {/* 表格区域 */}
        <div style={{ 
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          height: modalHeight - 180
        }}>
          <Table
            columns={viewMode === 'list' ? listColumns : treeColumns}
            dataSource={viewMode === 'list' ? filteredEnums : treeData as any}
            loading={loading}
            pagination={false}
            rowKey={viewMode === 'list' ? "id" : "value"}
            size="small"
            style={{ flex: 1 }}
            expandable={viewMode === 'tree' ? {
              expandedRowKeys,
              onExpandedRowsChange: (expandedRows) => {
                setExpandedRowKeys(expandedRows as string[]);
              },
              childrenColumnName: "children",
              indentSize: 20
            } : undefined}
          />
        </div>
      </Modal>

      {/* 枚举表单模态框 */}
      <EnumForm
        visible={formVisible}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        editingEnum={editingEnum}
      />
    </>
  );
};

export default EnumManagement; 