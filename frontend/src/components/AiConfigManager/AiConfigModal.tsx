import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Space, List, Card, message, Divider, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, RobotOutlined } from '@ant-design/icons';
import { getAiConfigs, postAiConfigs, putAiConfigsId, deleteAiConfigsId, postAiConfigsIdTest } from '@/services/BDC/api/aiConfigManagement';

const { Title, Text } = Typography;

interface AiConfig {
  id?: string;
  provider?: string;
  apiUrl?: string;
  apiKey?: string;
  model?: string;
  config?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

interface AiConfigModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: () => void;
  config?: AiConfig | null;
  onSuccess: () => void;
}

const AiConfigModal: React.FC<AiConfigModalProps> = ({
  visible,
  onCancel,
  onOk,
  config,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [aiConfigs, setAiConfigs] = useState<AiConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<AiConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 获取AI配置列表
  const fetchAiConfigs = async () => {
    try {
      const response = await getAiConfigs({});
      setAiConfigs(response || []);
    } catch (error) {
      message.error('获取AI配置列表失败');
      console.error('获取AI配置列表失败:', error);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchAiConfigs();
      if (config) {
        setSelectedConfig(config);
        setIsEditing(true);
        // 确保表单数据正确设置
        form.setFieldsValue({
          provider: config.provider || '',
          apiUrl: config.apiUrl || '',
          apiKey: config.apiKey || '',
          model: config.model || '',
          config: config.config ? JSON.stringify(config.config, null, 2) : ''
        });
      } else {
        setSelectedConfig(null);
        setIsEditing(false);
        form.resetFields();
        // 清空表单数据
        form.setFieldsValue({
          provider: '',
          apiUrl: '',
          apiKey: '',
          model: '',
          config: ''
        });
      }
    }
  }, [visible, config, form]);

  // 创建或更新配置
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // 处理config字段的JSON格式
      const submitData = { ...values };
      if (values.config && typeof values.config === 'string') {
        try {
          submitData.config = JSON.parse(values.config);
        } catch (e) {
          message.error('配置参数格式错误，请检查JSON格式');
          setLoading(false);
          return;
        }
      } else if (!values.config) {
        submitData.config = null;
      }

      if (isEditing && selectedConfig?.id) {
        await putAiConfigsId({ id: selectedConfig.id }, submitData);
        message.success('更新成功');
      } else {
        await postAiConfigs(submitData);
        message.success('创建成功');
      }
      onSuccess();
      handleCancel();
    } catch (error) {
      message.error(isEditing ? '更新失败' : '创建失败');
      console.error('保存AI配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 删除配置
  const handleDelete = async (config: AiConfig) => {
    if (!config.id) return;
    
    try {
      await deleteAiConfigsId({ id: config.id });
      message.success('删除成功');
      fetchAiConfigs();
      
      if (selectedConfig?.id === config.id) {
        setSelectedConfig(null);
        setIsEditing(false);
        form.resetFields();
      }
    } catch (error) {
      message.error('删除失败');
      console.error('删除AI配置失败:', error);
    }
  };

  // 测试配置
  const handleTest = async (config: AiConfig) => {
    if (!config.id) return;
    
    try {
      const result = await postAiConfigsIdTest({ id: config.id });
      if (result.success) {
        message.success('连接测试成功');
      } else {
        message.error('连接测试失败');
      }
    } catch (error) {
      message.error('连接测试失败');
      console.error('测试AI配置失败:', error);
    }
  };

  // 选择配置进行编辑
  const handleSelectConfig = (config: AiConfig) => {
    setSelectedConfig(config);
    setIsEditing(true);
    // 确保表单数据正确设置
    form.setFieldsValue({
      provider: config.provider || '',
      apiUrl: config.apiUrl || '',
      apiKey: config.apiKey || '',
      model: config.model || '',
      config: config.config ? JSON.stringify(config.config, null, 2) : ''
    });
  };

  // 新建配置
  const handleCreateNew = () => {
    setSelectedConfig(null);
    setIsEditing(false);
    form.resetFields();
    // 清空表单数据
    form.setFieldsValue({
      provider: '',
      apiUrl: '',
      apiKey: '',
      model: '',
      config: ''
    });
  };

  // 取消
  const handleCancel = () => {
    setSelectedConfig(null);
    setIsEditing(false);
    form.resetFields();
    onCancel();
  };

  const getDisplayName = (config: AiConfig) => {
    return `${config.provider} - ${config.model}`;
  };

  return (
    <Modal
      title="AI配置管理"
      open={visible}
      centered
      onCancel={handleCancel}
      onOk={onOk}
      width={1000}
      footer={null}
      destroyOnHidden
    >
      <div style={{ display: 'flex' }}>
        {/* 左侧：AI配置列表 */}
        <div style={{ width: '40%', borderRight: '1px solid #f0f0f011', paddingRight: '16px' }}>
          
          
          <List
            dataSource={aiConfigs}
            renderItem={(item) => (
              <List.Item
                style={{
                  cursor: 'pointer',
                  backgroundColor: selectedConfig?.id === item.id ? 'rgb(240 240 240 / 10%)' : 'transparent',
                  padding: '8px',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}
                onClick={() => handleSelectConfig(item)}
                actions={[
                  // <Button
                  //   size="small"
                  //   type="text"
                  //   icon={<EditOutlined />}
                  //   onClick={(e) => {
                  //     e.stopPropagation();
                  //     handleSelectConfig(item);
                  //   }}
                  // />,
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                  />
                ]}
              >
                <List.Item.Meta
                  avatar={<RobotOutlined style={{ fontSize: '16px' }} />}
                  title={getDisplayName(item)}
                  // description={
                  //   <div>
                  //     <Text type="secondary">{item.apiUrl}</Text>
                  //     <br />
                  //     <Space size="small">
                  //       <Button
                  //         size="small"
                  //         type="link"
                  //         onClick={(e) => {
                  //           e.stopPropagation();
                  //           handleTest(item);
                  //         }}
                  //       >
                  //         测试
                  //       </Button>
                  //     </Space>
                  //   </div>
                  // }
                />
              </List.Item>
            )}
          />

          <div style={{ marginTop: '16px' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateNew}
              style={{ width: '100%' }}
            >
              新建AI配置
            </Button>
          </div>

        </div>

        {/* 右侧：配置表单 */}
        <div style={{ width: '60%', paddingLeft: '16px' }}>
          <Title level={4}>
            {isEditing ? '编辑AI配置' : '新建AI配置'}
          </Title>
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={selectedConfig || {}}
          >
            <Form.Item
              name="provider"
              label="AI服务提供商"
              rules={[{ required: true, message: '请输入AI服务提供商' }]}
            >
              <Input placeholder="例如：openai, azure, anthropic" />
            </Form.Item>

            <Form.Item
              name="apiUrl"
              label="API地址"
              rules={[{ required: true, message: '请输入API地址' }]}
            >
              <Input placeholder="例如：https://api.openai.com/v1" />
            </Form.Item>

            <Form.Item
              name="apiKey"
              label="API密钥"
              rules={[{ required: true, message: '请输入API密钥' }]}
            >
              <Input.Password placeholder="请输入API密钥" />
            </Form.Item>

            <Form.Item
              name="model"
              label="AI模型名称"
              rules={[{ required: true, message: '请输入AI模型名称' }]}
            >
              <Input placeholder="例如：gpt-4, gpt-3.5-turbo" />
            </Form.Item>

            <Form.Item
              name="config"
              label="额外配置参数"
            >
              <Input.TextArea
                placeholder="JSON格式的额外配置参数，例如：&#10;{&#10;  &quot;temperature&quot;: 0.7,&#10;  &quot;max_tokens&quot;: 1000&#10;}"
                rows={4}
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {isEditing ? '更新' : '创建'}
                </Button>
                <Button onClick={handleCancel}>
                  取消
                </Button>
                {isEditing && selectedConfig?.id && (
                  <Button
                    onClick={() => handleTest(selectedConfig)}
                  >
                    测试连接
                  </Button>
                )}
              </Space>
            </Form.Item>
          </Form>
        </div>
      </div>
    </Modal>
  );
};

export default AiConfigModal; 