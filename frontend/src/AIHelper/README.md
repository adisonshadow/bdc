# AI Helper 使用指南

这个模块提供了与 AI 服务的集成功能，支持动态配置管理。

## 文件结构

```
AIHelper/
├── config.ts           # 配置文件和类型定义
├── aiService.ts        # AI 服务类
├── aiConfigService.ts  # AI配置管理服务
├── useAiConfig.ts      # React Hook for AI配置检查
├── example.ts          # 使用示例
├── index.ts            # 统一导出
└── README.md           # 使用说明
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

### 4. AI配置检查

```typescript
import { useAiConfig } from '@/AIHelper';

const MyComponent = () => {
  const { hasConfig, showConfigReminder } = useAiConfig();
  
  const handleAIOperation = () => {
    if (!hasConfig) {
      showConfigReminder();
      return;
    }
    // 执行AI操作
  };
  
  return (
    <button onClick={handleAIOperation}>
      执行AI操作
    </button>
  );
};
```

## 配置说明

### 动态AI配置

系统现在支持动态AI配置管理：

1. **用户配置管理**: 用户可以在界面中添加、编辑、删除AI配置
2. **自动选择**: 如果用户没有选择配置，系统会自动选择第一个可用配置
3. **配置检查**: 在发起AI操作前会自动检查配置是否可用
4. **用户提示**: 如果用户没有配置AI，会提示用户添加配置

### 配置参数

每个AI配置包含以下参数：

- **provider**: AI服务提供商（如：openai, azure, anthropic）
- **apiUrl**: API地址
- **apiKey**: API密钥
- **model**: AI模型名称
- **config**: 额外配置参数（JSON格式）

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
  console.log(response);
} catch (error) {
  if (error instanceof AIError) {
    switch (error.type) {
      case AIErrorType.AUTH_ERROR:
        console.error('认证失败，请检查API配置');
        break;
      case AIErrorType.NETWORK_ERROR:
        console.error('网络连接失败');
        break;
      // ... 其他错误类型
    }
  }
}
```

## 用户体验增强

### 1. 配置检查
- 在发起AI操作前自动检查配置是否可用
- 如果用户没有配置AI，会提示用户添加配置

### 2. 自动选择
- 如果用户添加了AI配置但没有选择，系统会自动选择第一个配置

### 3. 配置管理
- 支持多AI配置管理
- 支持配置的增删改查
- 支持配置测试功能

### 4. 错误提示
- 提供友好的错误提示信息
- 区分不同类型的错误（认证、网络、模型等）

## 使用建议

1. **首次使用**: 用户需要先添加AI配置才能使用AI功能
2. **配置管理**: 建议用户配置多个AI服务作为备选
3. **错误处理**: 系统会自动处理常见的错误情况
4. **性能优化**: 配置会进行缓存，提高响应速度

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