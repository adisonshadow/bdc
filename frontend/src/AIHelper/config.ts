// AI 接入配置文件
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequestPayload {
  model: string;
  messages: AIMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface AIResponseChoice {
  index: number;
  message: AIMessage;
  finish_reason: string;
}

export interface AIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: AIResponseChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// AI 服务配置
export const AI_CONFIG = {
  // API 基础地址
  BASE_URL: 'https://ark.cn-beijing.volces.com/api/v3',
  
  // 认证令牌
  API_TOKEN: '7fc0b313-69cb-420d-b7f3-04e6658242e6',
  
  // 默认模型
  DEFAULT_MODEL: 'deepseek-v3-250324',
  
  // 默认参数
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 2000,
  
  // 请求头
  HEADERS: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 7fc0b313-69cb-420d-b7f3-04e6658242e6'
  }
} as const;

// 系统提示词模板
export const SYSTEM_PROMPTS = {
  DEFAULT: '你是人工智能助手.',
  SCHEMA_HELPER: '你是一个数据库架构设计专家，可以帮助用户分析和优化数据库结构。',
  SQL_HELPER: '你是一个 SQL 专家，可以帮助用户编写和优化 SQL 查询语句。',
  BUSINESS_ANALYST: '你是一个业务分析师，可以帮助用户分析业务数据和需求。'
} as const;

// 错误类型定义
export enum AIErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  MODEL_ERROR = 'MODEL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class AIError extends Error {
  public type: AIErrorType;
  public status?: number;
  public details?: any;

  constructor(params: {
    type: AIErrorType;
    message: string;
    status?: number;
    details?: any;
  }) {
    super(params.message);
    this.name = 'AIError';
    this.type = params.type;
    this.status = params.status;
    this.details = params.details;
  }
}

// 工具函数
export const createSystemMessage = (content: string): AIMessage => ({
  role: 'system',
  content
});

export const createUserMessage = (content: string): AIMessage => ({
  role: 'user',
  content
});

export const createAssistantMessage = (content: string): AIMessage => ({
  role: 'assistant',
  content
});

// 构建请求载荷
export const buildRequestPayload = (
  messages: AIMessage[],
  model: string = AI_CONFIG.DEFAULT_MODEL,
  temperature: number = AI_CONFIG.DEFAULT_TEMPERATURE,
  maxTokens: number = AI_CONFIG.DEFAULT_MAX_TOKENS
): AIRequestPayload => ({
  model,
  messages,
  temperature,
  max_tokens: maxTokens,
  stream: false
});

// 验证响应格式
export const isValidAIResponse = (response: any): response is AIResponse => {
  return (
    response &&
    typeof response === 'object' &&
    Array.isArray(response.choices) &&
    response.choices.length > 0 &&
    response.choices[0].message &&
    typeof response.choices[0].message.content === 'string'
  );
};

// 提取 AI 回复内容
export const extractAIResponse = (response: AIResponse): string => {
  if (response.choices && response.choices.length > 0) {
    return response.choices[0].message.content;
  }
  return '';
}; 