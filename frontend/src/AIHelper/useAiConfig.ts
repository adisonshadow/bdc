import { useState, useEffect } from 'react';
import { message } from 'antd';
import { aiConfigService } from './aiConfigService';

export interface AiConfigStatus {
  hasConfig: boolean;
  currentConfig: any | null;
  loading: boolean;
  error: string | null;
}

export const useAiConfig = () => {
  const [status, setStatus] = useState<AiConfigStatus>({
    hasConfig: false,
    currentConfig: null,
    loading: true,
    error: null
  });

  const checkConfig = async () => {
    setStatus(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const hasConfig = await aiConfigService.hasAvailableConfig();
      const currentConfig = hasConfig ? await aiConfigService.getCurrentAiConfig() : null;
      
      setStatus({
        hasConfig,
        currentConfig,
        loading: false,
        error: null
      });
    } catch (error) {
      setStatus({
        hasConfig: false,
        currentConfig: null,
        loading: false,
        error: '检查AI配置失败'
      });
    }
  };

  useEffect(() => {
    checkConfig();
  }, []);

  const refreshConfig = () => {
    aiConfigService.clearCache();
    checkConfig();
  };

  const showConfigReminder = () => {
    message.warning('您还没有配置AI服务，请先添加AI配置');
  };

  return {
    ...status,
    refreshConfig,
    showConfigReminder
  };
}; 