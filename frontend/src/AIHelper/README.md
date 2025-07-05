# AI Helper 使用指南

这个模块提供了与 AI 服务的集成功能。

## 文件结构

```
AIHelper/
├── config.ts      # 配置文件和类型定义
├── aiService.ts   # AI 服务类
├── example.ts     # 使用示例
├── index.ts       # 统一导出
└── README.md      # 使用说明
```

## 快速开始

### 1. 基本使用

```typescript
import { sendAIMessage } from '@/AIHelper';

// 发送简单消息
const response = await sendAIMessage('你好，请介绍一下你自己');
console.log(response);
```

### 2. 专业助手

```typescript
import { getSchemaHelp, getSQLHelp, getBusinessAnalysis } from '@/AIHelper';

// 数据库架构助手
const schemaAdvice = await getSchemaHelp('请分析这个表结构是否合理');

// SQL 助手
const sqlQuery = await getSQLHelp('请帮我写一个查询用户表的 SQL');

// 业务分析助手
const analysis = await getBusinessAnalysis('分析这个数据规模是否合理');
```

### 3. 带上下文的对话

```typescript
import { aiService } from '@/AIHelper';

const contextMessages = [
  { role: 'user', content: '我有一个用户表' },
  { role: 'assistant', content: '好的，请继续' }
];

const response = await aiService.sendMessageWithContext(
  '请帮我优化这个表结构',
  contextMessages
);
```

## 配置说明

### API 配置

在 `config.ts` 中配置了以下参数：

- **BASE_URL**: `https://ark.cn-beijing.volces.com/api/v3`
- **API_TOKEN**: `7fc0b313-69cb-420d-b7f3-04e6658242e6`
- **DEFAULT_MODEL**: `deepseek-v3-250324`
- **DEFAULT_TEMPERATURE**: `0.7`
- **DEFAULT_MAX_TOKENS**: `2000`

### 系统提示词

预定义了三种专业角色：

- **DEFAULT**: 通用 AI 助手
- **SCHEMA_HELPER**: 数据库架构设计专家
- **SQL_HELPER**: SQL 专家
- **BUSINESS_ANALYST**: 业务分析师

## 错误处理

模块提供了完善的错误处理机制：

```typescript
try {
  const response = await sendAIMessage('测试消息');
} catch (error: any) {
  if (error.type) {
    switch (error.type) {
      case 'NETWORK_ERROR':
        console.error('网络连接失败');
        break;
      case 'AUTH_ERROR':
        console.error('认证失败');
        break;
      case 'RATE_LIMIT_ERROR':
        console.error('请求频率过高');
        break;
      default:
        console.error('其他错误');
    }
  }
}
```

## 高级用法

### 自定义参数

```typescript
import { aiService } from '@/AIHelper';

const messages = [
  { role: 'system', content: '你是一个简洁的技术顾问' },
  { role: 'user', content: '什么是数据库索引？' }
];

const response = await aiService.chat(
  messages,
  'deepseek-v3-250324', // 模型
  0.3, // 温度（更确定性）
  500  // 最大令牌数
);
```

### 工具函数

```typescript
import { 
  createSystemMessage, 
  createUserMessage, 
  createAssistantMessage,
  buildRequestPayload 
} from '@/AIHelper';

const systemMsg = createSystemMessage('你是 AI 助手');
const userMsg = createUserMessage('你好');
const assistantMsg = createAssistantMessage('你好！有什么可以帮助你的吗？');

const payload = buildRequestPayload([systemMsg, userMsg, assistantMsg]);
```

## 注意事项

1. **API 令牌安全**: 当前配置中的 API 令牌是硬编码的，生产环境中应该使用环境变量
2. **错误重试**: 对于网络错误，建议实现重试机制
3. **请求限制**: 注意 API 的请求频率限制
4. **响应缓存**: 对于重复请求，可以考虑实现缓存机制

## 示例代码

查看 `example.ts` 文件获取更多使用示例，包括：

- 基本消息发送
- 专业助手使用
- 上下文对话
- 错误处理
- 自定义参数

## 更新日志

- 初始版本：基于提供的 curl 请求创建基础配置
- 支持多种专业角色
- 完善的错误处理机制
- 提供便捷的使用函数 