// AI Helper 模块统一导出

// 配置和类型
export * from './config';

// 服务类
export * from './aiService';

// AI配置服务
export * from './aiConfigService';

// React Hooks
export * from './useAiConfig';

// AI响应解析工具
export * from './aiResponseParser';

// 重新导出主要功能，方便使用
export {
  aiService,
  sendAIMessage,
  getSchemaHelp,
  getSQLHelp,
  getBusinessAnalysis
} from './aiService';
export { aiConfigService } from './aiConfigService';
export { useAiConfig } from './useAiConfig';
export { parseAIResponse, cleanAIResponse, fixTruncatedJSON, validateParsedData } from './aiResponseParser';
export { generateModelDesignPrompt } from './modelDesignPromptGenerator';
export type { ModelDesignContext, ModelDesignPromptOptions } from './modelDesignPromptGenerator';
export { generateEnumFixPrompt } from './enumFixPromptGenerator';
export type { EnumFixContext, EnumFixPromptOptions } from './enumFixPromptGenerator'; 