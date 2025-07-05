// AI Helper 模块统一导出

// 配置和类型
export * from './config';

// 服务类
export * from './aiService';

// 重新导出主要功能，方便使用
export {
  aiService,
  sendAIMessage,
  getSchemaHelp,
  getSQLHelp,
  getBusinessAnalysis
} from './aiService'; 