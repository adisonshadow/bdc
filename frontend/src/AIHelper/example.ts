// AI Helper 使用示例

import { 
  aiService, 
  sendAIMessage, 
  getSchemaHelp, 
  getSQLHelp, 
  getBusinessAnalysis,
  AIMessage 
} from './index';

// 示例 1: 基本使用
export async function basicExample() {
  try {
    const response = await sendAIMessage('你好，请介绍一下你自己');
    console.log('AI 回复:', response);
  } catch (error) {
    console.error('AI 调用失败:', error);
  }
}

// 示例 2: 数据库架构助手
export async function schemaHelperExample() {
  try {
    const response = await getSchemaHelp(
      '请帮我分析一下这个数据库表结构是否合理：CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(50), email VARCHAR(100));'
    );
    console.log('架构建议:', response);
  } catch (error) {
    console.error('架构分析失败:', error);
  }
}

// 示例 3: SQL 助手
export async function sqlHelperExample() {
  try {
    const response = await getSQLHelp(
      '请帮我写一个查询，从 users 表中查找所有邮箱以 @gmail.com 结尾的用户'
    );
    console.log('SQL 查询:', response);
  } catch (error) {
    console.error('SQL 生成失败:', error);
  }
}

// 示例 4: 带上下文的对话
export async function contextExample() {
  try {
    const contextMessages: AIMessage[] = [
      { role: 'user', content: '我有一个用户表，包含 id, name, email 字段' },
      { role: 'assistant', content: '好的，我了解了你的用户表结构。' },
      { role: 'user', content: '现在我想添加一个年龄字段' },
      { role: 'assistant', content: '你可以使用 ALTER TABLE 语句添加年龄字段。' }
    ];
    
    const response = await aiService.sendMessageWithContext(
      '请给我具体的 SQL 语句',
      contextMessages,
      '你是一个 SQL 专家，专门帮助用户编写和优化 SQL 语句。'
    );
    
    console.log('带上下文的回复:', response);
  } catch (error) {
    console.error('上下文对话失败:', error);
  }
}

// 示例 5: 业务分析助手
export async function businessAnalysisExample() {
  try {
    const response = await getBusinessAnalysis(
      '我们有一个电商平台，用户表有 100 万用户，订单表有 500 万订单，请分析一下这个数据规模是否合理'
    );
    console.log('业务分析:', response);
  } catch (error) {
    console.error('业务分析失败:', error);
  }
}

// 示例 6: 自定义参数
export async function customParamsExample() {
  try {
    const messages: AIMessage[] = [
      { role: 'system', content: '你是一个简洁的技术顾问，回答要简短精炼。' },
      { role: 'user', content: '什么是数据库索引？' }
    ];
    
    const response = await aiService.chat(
      messages,
      'deepseek-v3-250324', // 模型
      0.3, // 温度（更确定性）
      500  // 最大令牌数
    );
    
    console.log('自定义参数回复:', response);
  } catch (error) {
    console.error('自定义参数调用失败:', error);
  }
}

// 错误处理示例
export async function errorHandlingExample() {
  try {
    // 故意发送一个可能导致错误的请求
    const response = await sendAIMessage('');
  } catch (error: any) {
    if (error.type) {
      switch (error.type) {
        case 'NETWORK_ERROR':
          console.error('网络错误:', error.message);
          break;
        case 'AUTH_ERROR':
          console.error('认证错误:', error.message);
          break;
        case 'RATE_LIMIT_ERROR':
          console.error('频率限制:', error.message);
          break;
        default:
          console.error('其他错误:', error.message);
      }
    } else {
      console.error('未知错误:', error);
    }
  }
} 