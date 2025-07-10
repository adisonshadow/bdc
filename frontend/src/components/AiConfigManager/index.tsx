import React, { useState, useEffect } from 'react';
import { Button, Modal, Select, Space, message, Spin } from 'antd';
import { CaretDownOutlined, SettingOutlined, PlusOutlined } from '@ant-design/icons';
import { getAiConfigs, postAiConfigs, deleteAiConfigsId, putAiConfigsId, postAiConfigsIdTest } from '@/services/BDC/api/aiConfigManagement';
import { saveSelectedAiConfig, getSelectedAiConfigId, clearSelectedAiConfig } from '@/utils/aiConfigStorage';
import AiConfigModal from './AiConfigModal';
import './index.less';

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

const AiConfigManager: React.FC = () => {
  const [aiConfigs, setAiConfigs] = useState<AiConfig[]>([]);
  const [currentAiConfig, setCurrentAiConfig] = useState<AiConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<AiConfig | null>(null);

  // 获取AI配置列表
  const fetchAiConfigs = async () => {
    setLoading(true);
    try {
      const response = await getAiConfigs({});
      setAiConfigs(response || []);
      
      // 从localStorage获取上次选择的AI配置
      const savedAiConfigId = getSelectedAiConfigId();
      
      if (response && response.length > 0) {
        if (savedAiConfigId) {
          // 尝试恢复上次选择的配置
          const savedConfig = response.find(config => config.id === savedAiConfigId);
          if (savedConfig) {
            setCurrentAiConfig(savedConfig);
          } else {
            // 如果保存的配置不存在，选择第一个
            setCurrentAiConfig(response[0]);
            clearSelectedAiConfig();
          }
        } else {
          // 没有保存的配置，选择第一个
          setCurrentAiConfig(response[0]);
        }
      }
    } catch (error) {
      message.error('获取AI配置列表失败');
      console.error('获取AI配置列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiConfigs();
  }, []);

  // 切换AI配置
  const handleAiConfigChange = (value: string) => {
    const config = aiConfigs.find(c => c.id === value);
    setCurrentAiConfig(config || null);
    
    // 保存选择的AI配置到localStorage
    if (config?.id) {
      saveSelectedAiConfig(config.id);
    } else {
      clearSelectedAiConfig();
    }
    
    message.success(`已切换到 ${config?.provider} - ${config?.model}`);
  };

  // 打开配置Modal
  const handleOpenConfig = () => {
    setConfigModalVisible(true);
  };

  // 关闭配置Modal
  const handleCloseConfig = () => {
    setConfigModalVisible(false);
    setSelectedConfig(null);
    fetchAiConfigs(); // 刷新列表
  };

  // 创建新配置
  const handleCreateConfig = () => {
    setSelectedConfig(null);
    setConfigModalVisible(true);
  };

  // 编辑配置
  const handleEditConfig = (config: AiConfig) => {
    setSelectedConfig(config);
    setConfigModalVisible(true);
  };

  // 删除配置
  const handleDeleteConfig = async (config: AiConfig) => {
    if (!config.id) return;
    
    try {
      await deleteAiConfigsId({ id: config.id });
      message.success('删除成功');
      fetchAiConfigs();
      
      // 如果删除的是当前选中的配置，清空选择并清除localStorage
      if (currentAiConfig?.id === config.id) {
        setCurrentAiConfig(null);
        clearSelectedAiConfig();
      }
    } catch (error) {
      message.error('删除失败');
      console.error('删除AI配置失败:', error);
    }
  };

  // 测试配置
  const handleTestConfig = async (config: AiConfig) => {
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

  const getDisplayName = (config: AiConfig) => {
    return `${config.provider} - ${config.model}`;
  };

  return (
    <div className="ai-config-manager">
      <Space>
        {/* AI切换按钮 */}
        <Select
          value={currentAiConfig?.id}
          onChange={handleAiConfigChange}
          placeholder="选择AI配置"
          style={{ maxWidth: 160 }}
          variant="filled"
          loading={loading}
          suffixIcon={<CaretDownOutlined style={
            { color: '#fff', backgroundColor: '#00000077', borderRadius: '50%', padding: '4px' }
          } />}
          notFoundContent={loading ? <Spin size="small" /> : '暂无配置'}
          dropdownRender={(menu) => (
            <div>
              {menu}
              <div style={{ padding: '1px'}}>
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={handleCreateConfig}
                  style={{ width: '100%' }}
                >
                  添加/配置 AI
                </Button>
              </div>
            </div>
          )}
        >
          {aiConfigs.map(config => (
            <Select.Option key={config.id} value={config.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{getDisplayName(config)}</span>
                <Space size="small">
                  <Button
                    size="small"
                    type="text"
                    icon={<SettingOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditConfig(config);
                    }}
                  />
                  <Button
                    size="small"
                    type="text"
                    danger
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConfig(config);
                    }}
                  >
                    删除
                  </Button>
                </Space>
              </div>
            </Select.Option>
          ))}
        </Select>

        {/* 配置按钮 */}
        {/* <Button
          icon={<SettingOutlined />}
          onClick={handleOpenConfig}
          title="AI配置管理"
        >
          配置
        </Button> */}
      </Space>

      {/* AI配置Modal */}
      <AiConfigModal
        visible={configModalVisible}
        onCancel={handleCloseConfig}
        onOk={handleCloseConfig}
        config={selectedConfig}
        onSuccess={fetchAiConfigs}
      />
    </div>
  );
};

export default AiConfigManager; 