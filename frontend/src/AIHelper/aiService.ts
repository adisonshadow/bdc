import {
  AI_CONFIG,
  AIMessage,
  AIRequestPayload,
  AIResponse,
  AIError,
  AIErrorType,
  buildRequestPayload,
  isValidAIResponse,
  extractAIResponse,
  SYSTEM_PROMPTS
} from './config';

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
   * 发送聊天请求到 AI 服务
   */
  async chat(
    messages: AIMessage[],
    model?: string,
    temperature?: number,
    maxTokens?: number
  ): Promise<string> {
    try {
      const payload = buildRequestPayload(
        messages,
        model,
        temperature,
        maxTokens
      );
      
      const response = await this.makeRequest(payload);
      
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
  private async makeRequest(payload: AIRequestPayload): Promise<AIResponse> {
    const response = await fetch(`${AI_CONFIG.BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: AI_CONFIG.HEADERS,
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