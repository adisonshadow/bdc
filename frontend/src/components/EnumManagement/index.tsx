import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Segmented,
  Popover,
  List,
  Form,
  Select,
  Card,
  Typography
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  RobotOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { getEnums, deleteEnumsId, putEnumsId } from '@/services/BDC/api/enumManagement';
import EnumForm from './EnumForm';
import { buildTree, enumTreeConfig } from '@/utils/treeBuilder';
import { validateEnum, getValidationDisplayText, getValidationColor } from './validator';
import { generateEnumFixPrompt } from '@/AIHelper';
import { getSchemaHelp, useAiConfig } from '@/AIHelper';
import { AIError, AIErrorType } from '@/AIHelper/config';
import AIButton from '@/components/AIButton';
import AILoading from '@/components/AILoading';
import { useSimpleAILoading } from '@/components/AILoading/useAILoading';
import ValidationPopover, { ValidationIssue } from '@/components/ValidationPopover';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface EnumManagementProps {
  visible: boolean;
  onClose: () => void;
  onEnumCreated?: (enumData: any) => void;
  onEnumUpdated?: (enumData: any) => void;
  onEnumDeleted?: (enumId: string) => void;
}

const EnumManagement: React.FC<EnumManagementProps> = ({ visible, onClose, onEnumCreated, onEnumUpdated, onEnumDeleted }) => {
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
  const { isVisible: isAutoFixing, text: aiLoadingText, showLoading, hideLoading } = useSimpleAILoading();
  
  // AI配置检查
  const { hasConfig, showConfigReminder } = useAiConfig();
  
  // 检查AI配置
  const checkAIConfig = () => {
    if (!hasConfig) {
      showConfigReminder();
      return false;
    }
    return true;
  };

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
  
  // 调试日志：监听isAutoFixing状态变化
  useEffect(() => {
    console.log('isAutoFixing状态变化:', isAutoFixing);
  }, [isAutoFixing]);

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
  const filteredEnums = useMemo(() => enums.filter(enumItem =>
    enumItem.name.toLowerCase().includes(searchText.toLowerCase()) ||
    enumItem.code.toLowerCase().includes(searchText.toLowerCase()) ||
    enumItem.description?.toLowerCase().includes(searchText.toLowerCase())
  ), [enums, searchText]);

  // 构建树形数据
  const treeData = useMemo(() => buildTree(filteredEnums, enumTreeConfig), [filteredEnums]);

  // 收集所有树节点的key
  const collectAllKeys = useCallback((nodes: any[]): string[] => {
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
  }, []);

  // 当切换到树形视图时，展开所有节点
  useEffect(() => {
    if (viewMode === 'tree' && treeData.length > 0) {
      const keys = collectAllKeys(treeData);
      setExpandedRowKeys(keys);
    }
  }, [viewMode, filteredEnums.length]);

  // 处理删除枚举
  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteEnumsId({ id });
      message.success('枚举删除成功');
      fetchEnums();
      onEnumDeleted?.(id);
    } catch (error: any) {
      console.error('删除枚举失败:', error);
      const errorMessage = error.response?.data?.message || '删除枚举失败';
      message.error(errorMessage);
    }
  }, [fetchEnums, onEnumDeleted]);

  // 处理编辑枚举
  const handleEdit = useCallback((record: API.Enum) => {
    setEditingEnum(record);
    setFormVisible(true);
  }, []);

  // 处理添加枚举
  const handleAdd = useCallback(() => {
    setEditingEnum(null);
    setFormVisible(true);
  }, []);

  // 处理表单成功
  const handleFormSuccess = useCallback(() => {
    fetchEnums();
    onEnumCreated?.(editingEnum);
  }, [fetchEnums, editingEnum, onEnumCreated]);

  // 处理表单关闭
  const handleFormClose = useCallback(() => {
    setFormVisible(false);
    setEditingEnum(null);
  }, []);

  // 自动修复处理函数
  const handleAutoFix = useCallback(async (record: API.Enum) => {
    console.log('开始AI自动修复，记录:', record);
    
    // 检查AI配置
    if (!checkAIConfig()) {
      return;
    }
    
    showLoading('AI 正在分析并修复验证错误...');
    console.log('showLoading已调用，isAutoFixing状态:', isAutoFixing);
    try {
      // 获取当前验证结果
      const validationResult = validateEnum(record);
      console.log('验证结果:', validationResult);

      // 构建 AI 提示词
      const prompt = generateEnumFixPrompt(
        {
          currentEnum: record,
          validationIssues: validationResult.issues
        },
        {
          operationType: 'fix'
        }
      );
      console.log('生成的AI提示词:', prompt);

      // 调用 AI 服务
      console.log('开始调用AI服务...');
      const aiResponse = await getSchemaHelp(prompt);
      console.log('AI服务响应:', aiResponse);
      
      // 尝试解析 AI 返回的 JSON
      let fixedEnum;
      try {
        // 提取 JSON 部分
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          fixedEnum = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('未找到有效的 JSON 数据');
        }
      } catch (parseError) {
        console.error('解析 AI 响应失败:', parseError);
        message.error('AI 返回的数据格式不正确，请手动修复');
        return;
      }

      // 验证修复后的枚举
      if (fixedEnum.name && fixedEnum.code && Array.isArray(fixedEnum.options)) {
        // 更新枚举
        await putEnumsId({ id: record.id! }, fixedEnum);
        message.success('AI 自动修复成功！');
        fetchEnums(); // 刷新列表
        onEnumUpdated?.(fixedEnum);
      } else {
        message.error('AI 返回的枚举格式不正确');
      }
    } catch (error) {
      console.error('AI 自动修复失败:', error);
      handleAIError(error);
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading, checkAIConfig, handleAIError, fetchEnums, onEnumUpdated]);

  // 统一的列定义
  const columns = useMemo(() => [
    {
      title: '代码',
      dataIndex: viewMode === 'tree' ? 'value' : 'code',
      key: 'code',
      width: viewMode === 'tree' ? 300 : undefined,
      render: (text: string, record: any) => {
        // 树形视图：虚拟节点显示节点名称，叶子节点显示代码标签
        if (viewMode === 'tree') {
          if (record.children && record.children.length > 0) {
            return <span style={{ fontWeight: 'bold' }}>{record.label}</span>;
          }
          return <Tag color="blue">{text}</Tag>;
        }
        // 列表视图：显示代码标签
        return <Tag color="blue">{text}</Tag>;
      }
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: viewMode === 'tree' ? 200 : undefined,
      ellipsis: true,
      render: (text: any, record: any) => {
        // 树形视图：只有叶子节点才显示描述
        if (viewMode === 'tree' && record.children && record.children.length > 0) {
          return null;
        }
        
        // 树形视图时，从 rawEnum 中获取描述
        const description = viewMode === 'tree' ? (record.rawEnum?.description || text) : text;
        return description;
      }
    },
    {
      title: '校验',
      key: 'validation',
      width: 100,
      render: (record: any) => {
        // 树形视图：只有叶子节点才显示校验
        if (viewMode === 'tree' && record.children && record.children.length > 0) {
          return null;
        }
        
        const enumData = viewMode === 'tree' ? (record.rawEnum || record) : record;
        const result = validateEnum(enumData);
        
        // 将校验结果转换为ValidationIssue格式
        const validationIssues: ValidationIssue[] = result.issues.map(issue => ({
          type: issue.type,
          message: issue.message
        }));
        
        return (
          <ValidationPopover
            title="校验详情"
            issues={validationIssues}
            aiButtonText="AI 自动修复"
            onAIFix={async () => {
              await handleAutoFix(enumData);
            }}
            trigger="click"
            placement="top"
            maxWidth={320}
            showAIFix={true}
          >
            <Tag color={getValidationColor(result)} style={{ cursor: 'pointer' }}>
              {getValidationDisplayText(result)}
            </Tag>
          </ValidationPopover>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: any, record: any) => {
        // 树形视图：只有叶子节点才显示状态
        if (viewMode === 'tree' && record.children && record.children.length > 0) {
          return null;
        }
        
        // 树形视图时，从 rawEnum 中获取状态
        const activeStatus = viewMode === 'tree' ? (record.rawEnum?.isActive ?? isActive) : isActive;
        return (
          <Tag color={activeStatus ? 'success' : 'default'}>
            {activeStatus ? '启用' : '禁用'}
          </Tag>
        );
      }
    },
    {
      title: '选项数量',
      key: 'optionsCount',
      width: 80,
      render: (record: any) => {
        // 树形视图：只有叶子节点才显示选项数量
        if (viewMode === 'tree' && record.children && record.children.length > 0) {
          return null;
        }
        
        const options = record.options || [];
        const optionsContent = (
          <div style={{ maxWidth: 300, maxHeight: 280, overflow: 'auto' }}>
            {options.length > 0 ? (
              <List
                size="small"
                dataSource={options}
                renderItem={(option: any, index: number) => (
                  <List.Item
                    key={index}
                    style={{ 
                      padding: '8px 12px', 
                      borderRadius: 4,
                      marginBottom: 4
                    }}
                  >
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ fontWeight: 'bold', color: '#1890ff' }}>{option.value}</div>
                        {option.order !== undefined && (
                          <div style={{ color: '#999', fontSize: '12px' }}>排序: {option.order}</div>
                        )}
                      </div>
                      <div style={{ color: '#666', marginBottom: 2 }}>{option.label}</div>
                      {option.description && (
                        <div style={{ color: '#999', fontSize: '12px' }}>{option.description}</div>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ color: '#999' }}>暂无选项</div>
            )}
          </div>
        );

        return (
          <Popover
            content={optionsContent}
            title="枚举选项详情"
            trigger="hover"
            placement="right"
            overlayStyle={{ maxWidth: 400 }}
          >
            <Tag color="green" style={{ cursor: 'pointer' }}>{options.length}</Tag>
          </Popover>
        );
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (text: any, record: any) => {
        // 树形视图：只有叶子节点才显示创建时间
        if (viewMode === 'tree' && record.children && record.children.length > 0) {
          return null;
        }
        
        // 树形视图时，从 rawEnum 中获取创建时间
        const createdAt = viewMode === 'tree' ? (record.rawEnum?.createdAt || text) : text;
        return createdAt ? new Date(createdAt).toLocaleString() : '-';
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (record: any) => {
        // 树形视图：只有叶子节点才显示操作按钮
        if (viewMode === 'tree' && record.children && record.children.length > 0) {
          return null;
        }
        
        const enumData = viewMode === 'tree' ? (record.rawEnum || record) : record;
        return (
          <Space size="small">
            <Tooltip title="编辑">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(enumData)}
              />
            </Tooltip>
            <Popconfirm
              title="确定要删除这个枚举吗？"
              description="删除后无法恢复，请谨慎操作"
              onConfirm={() => handleDelete(enumData.id!)}
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
  ], [viewMode, handleEdit, handleDelete]);

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
            columns={columns}
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
        <AILoading 
          visible={isAutoFixing} 
          text={aiLoadingText} 
        />
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