import {
  AIMessage,
  AIRequestPayload,
  AIResponse,
  AIError,
  AIErrorType,
  isValidAIResponse,
  extractAIResponse,
  SYSTEM_PROMPTS
} from './config';
import { aiConfigService, DynamicAIConfig } from './aiConfigService';

export class AIService {
  private static instance: AIService;
  
  private constructor() {}
  
  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * 检查AI配置是否可用
   */
  async checkConfigAvailability(): Promise<{ available: boolean; message?: string }> {
    const hasConfig = await aiConfigService.hasAvailableConfig();
    
    if (!hasConfig) {
      return {
        available: false,
        message: '您还没有配置AI服务，请先添加AI配置'
      };
    }

    const currentConfig = await aiConfigService.getCurrentAiConfig();
    if (!currentConfig) {
      return {
        available: false,
        message: '无法获取AI配置，请检查配置是否正确'
      };
    }

    return { available: true };
  }

  /**
   * 获取动态AI配置
   */
  private async getDynamicConfig(): Promise<DynamicAIConfig> {
    const currentConfig = await aiConfigService.getCurrentAiConfig();
    if (!currentConfig) {
      throw new AIError({
        type: AIErrorType.AUTH_ERROR,
        message: '未找到可用的AI配置，请先添加AI配置'
      });
    }

    return aiConfigService.convertToDynamicConfig(currentConfig);
  }

  /**
   * 构建请求载荷
   */
  private buildRequestPayload(
    messages: AIMessage[],
    dynamicConfig: DynamicAIConfig,
    temperature?: number,
    maxTokens?: number
  ): AIRequestPayload {
    return {
      model: dynamicConfig.model,
      messages,
      temperature: temperature ?? dynamicConfig.temperature ?? 0.7,
      max_tokens: maxTokens ?? dynamicConfig.maxTokens ?? 2000,
      stream: false
    };
  }
  
  /**
   * 发送聊天请求到 AI 服务
   */
  async chat(
    messages: AIMessage[],
    model?: string,
    temperature?: number,
    maxTokens?: number
  ): Promise<string> {
    try {
      // 检查配置可用性
      const configCheck = await this.checkConfigAvailability();
      if (!configCheck.available) {
        throw new AIError({
          type: AIErrorType.AUTH_ERROR,
          message: configCheck.message || 'AI配置不可用'
        });
      }

      const dynamicConfig = await this.getDynamicConfig();
      
      // 如果指定了模型，使用指定的模型，否则使用配置中的模型
      const targetModel = model || dynamicConfig.model;
      
      const payload = this.buildRequestPayload(
        messages,
        dynamicConfig,
        temperature,
        maxTokens
      );

      // 如果指定了模型，更新payload中的模型
      if (model) {
        payload.model = model;
      }
      
      const response = await this.makeRequest(payload, dynamicConfig);
      
      if (!isValidAIResponse(response)) {
        throw new AIError({
          type: AIErrorType.MODEL_ERROR,
          message: 'AI 响应格式无效',
          details: response
        });
      }
      
      return extractAIResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * 发送简单用户消息
   */
  async sendMessage(
    userMessage: string,
    systemPrompt: string = SYSTEM_PROMPTS.DEFAULT
  ): Promise<string> {
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];
    
    return this.chat(messages);
  }
  
  /**
   * 发送带上下文的对话
   */
  async sendMessageWithContext(
    userMessage: string,
    contextMessages: AIMessage[],
    systemPrompt: string = SYSTEM_PROMPTS.DEFAULT
  ): Promise<string> {
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...contextMessages,
      { role: 'user', content: userMessage }
    ];
    
    return this.chat(messages);
  }
  
  /**
   * 数据库架构助手
   */
  async getSchemaHelp(userMessage: string, contextMessages?: AIMessage[]): Promise<string> {
    return this.sendMessageWithContext(
      userMessage,
      contextMessages || [],
      SYSTEM_PROMPTS.SCHEMA_HELPER
    );
  }
  
  /**
   * SQL 助手
   */
  async getSQLHelp(userMessage: string, contextMessages?: AIMessage[]): Promise<string> {
    return this.sendMessageWithContext(
      userMessage,
      contextMessages || [],
      SYSTEM_PROMPTS.SQL_HELPER
    );
  }
  
  /**
   * 业务分析助手
   */
  async getBusinessAnalysis(userMessage: string, contextMessages?: AIMessage[]): Promise<string> {
    return this.sendMessageWithContext(
      userMessage,
      contextMessages || [],
      SYSTEM_PROMPTS.BUSINESS_ANALYST
    );
  }
  
  /**
   * 执行 API 请求
   */
  private async makeRequest(payload: AIRequestPayload, dynamicConfig: DynamicAIConfig): Promise<AIResponse> {
    const response = await fetch(dynamicConfig.baseUrl, {
      method: 'POST',
      headers: dynamicConfig.headers,
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * 错误处理
   */
  private handleError(error: any): AIError {
    if (error instanceof AIError) {
      return error;
    }
    
    // 网络错误
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new AIError({
        type: AIErrorType.NETWORK_ERROR,
        message: '网络连接失败，请检查网络连接',
        details: error
      });
    }
    
    // HTTP 错误
    if (error.message && error.message.includes('HTTP')) {
      const status = parseInt(error.message.match(/HTTP (\d+)/)?.[1] || '0');
      
      if (status === 401) {
        return new AIError({
          type: AIErrorType.AUTH_ERROR,
          message: '认证失败，请检查 API 令牌',
          status,
          details: error
        });
      }
      
      if (status === 429) {
        return new AIError({
          type: AIErrorType.RATE_LIMIT_ERROR,
          message: '请求频率过高，请稍后重试',
          status,
          details: error
        });
      }
      
      return new AIError({
        type: AIErrorType.MODEL_ERROR,
        message: `服务器错误 (${status})`,
        status,
        details: error
      });
    }
    
    // 其他错误
    return new AIError({
      type: AIErrorType.UNKNOWN_ERROR,
      message: error.message || '未知错误',
      details: error
    });
  }
}

// 导出单例实例
export const aiService = AIService.getInstance();

// 便捷函数
export const sendAIMessage = (message: string, systemPrompt?: string) => 
  aiService.sendMessage(message, systemPrompt);

export const getSchemaHelp = (message: string, context?: AIMessage[]) => 
  aiService.getSchemaHelp(message, context);

export const getSQLHelp = (message: string, context?: AIMessage[]) => 
  aiService.getSQLHelp(message, context);

export const getBusinessAnalysis = (message: string, context?: AIMessage[]) => 
  aiService.getBusinessAnalysis(message, context); 