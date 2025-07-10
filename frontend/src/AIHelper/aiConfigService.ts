import { getAiConfigs } from '@/services/BDC/api/aiConfigManagement';
import { getSelectedAiConfigId } from '@/utils/aiConfigStorage';

export interface AiConfig {
  id?: string;
  provider?: string;
  apiUrl?: string;
  apiKey?: string;
  model?: string;
  config?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface DynamicAIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  headers: Record<string, string>;
}

class AIConfigService {
  private static instance: AIConfigService;
  private cachedConfigs: AiConfig[] = [];
  private lastFetchTime = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  private constructor() {}

  public static getInstance(): AIConfigService {
    if (!AIConfigService.instance) {
      AIConfigService.instance = new AIConfigService();
    }
    return AIConfigService.instance;
  }

  /**
   * 获取AI配置列表
   */
  async getAiConfigs(): Promise<AiConfig[]> {
    const now = Date.now();
    
    // 如果缓存未过期，直接返回
    if (now - this.lastFetchTime < this.CACHE_DURATION && this.cachedConfigs.length > 0) {
      return this.cachedConfigs;
    }

    try {
      const configs = await getAiConfigs({});
      this.cachedConfigs = configs || [];
      this.lastFetchTime = now;
      return this.cachedConfigs;
    } catch (error) {
      console.error('获取AI配置失败:', error);
      return [];
    }
  }

  /**
   * 获取当前选择的AI配置
   */
  async getCurrentAiConfig(): Promise<AiConfig | null> {
    const configs = await this.getAiConfigs();
    
    if (configs.length === 0) {
      return null;
    }

    // 获取用户选择的配置ID
    const selectedConfigId = getSelectedAiConfigId();
    
    if (selectedConfigId) {
      const selectedConfig = configs.find(config => config.id === selectedConfigId);
      if (selectedConfig) {
        return selectedConfig;
      }
    }

    // 如果没有选择或选择的配置不存在，返回第一个配置
    return configs[0];
  }

  /**
   * 将AI配置转换为动态配置格式
   */
  convertToDynamicConfig(aiConfig: AiConfig): DynamicAIConfig {
    const config = aiConfig.config || {};
    
    return {
      baseUrl: aiConfig.apiUrl || '',
      apiKey: aiConfig.apiKey || '',
      model: aiConfig.model || '',
      temperature: config.temperature || 0.7,
      maxTokens: config.max_tokens || 2000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey || ''}`
      }
    };
  }

  /**
   * 检查是否有可用的AI配置
   */
  async hasAvailableConfig(): Promise<boolean> {
    const configs = await this.getAiConfigs();
    return configs.length > 0;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cachedConfigs = [];
    this.lastFetchTime = 0;
  }
}

export const aiConfigService = AIConfigService.getInstance(); 