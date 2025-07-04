# AI 自动修复功能使用说明

## 功能概述

在模型验证失败时，系统现在提供了 AI 自动修复功能。当数据表结构存在验证错误或警告时，用户可以点击"自动修复"按钮，让 AI 分析问题并自动修复模型。

## 使用方法

### 1. 触发自动修复

1. 在 SchemaManagement 页面选择一个数据表
2. 如果数据表存在验证问题，会在数据表名称旁边显示"验证未通过"标签
3. 鼠标悬停在验证标签上，会显示详细的问题列表
4. 在问题列表的最下方，会显示"自动修复"按钮
5. 点击"自动修复"按钮，AI 将开始分析并修复问题

### 2. 修复过程

- 点击按钮后，按钮会显示"AI 修复中..."状态
- AI 会分析当前的模型定义和验证错误
- 生成修复后的模型 JSON
- 自动应用修复结果到当前数据表
- 修复完成后显示成功提示

### 3. 修复结果

- 修复成功后，验证标签会更新为"验证通过"
- 如果仍有问题，可以再次使用自动修复功能
- 所有修复操作都会保存到后端数据库

## 技术实现

### AI 提示词模板

系统会构建以下格式的提示词发送给 AI：

```
请帮我修复这个数据表模型中的验证错误。以下是当前的模型定义和验证错误：

当前模型：
{
  "fields": [...],
  "keyIndexes": {...}
}

验证错误：
- error: 主键字段 "id" 允许空值 (主键字段必须设置为必填)
- warning: 缺少主键 (建议设置一个 UUID 或自增长 ID 字段作为主键)

请返回修复后的完整模型 JSON，格式如下：
{
  "fields": [...],
  "keyIndexes": {...}
}

只返回 JSON 格式的数据，不要包含其他说明文字。
```

### 支持的修复类型

AI 可以修复以下类型的验证问题：

1. **主键相关**
   - 主键字段允许空值 → 设置为必填
   - 缺少主键 → 添加合适的主键字段
   - 主键字段类型不合适 → 建议更合适的字段类型

2. **索引相关**
   - 唯一索引字段允许空值 → 设置为必填
   - 全文索引字段类型不合适 → 建议文本类型字段
   - 空间索引字段类型不合适 → 建议字符串类型字段

3. **字段配置**
   - 字符串字段未设置长度 → 添加长度限制
   - 日期字段未设置类型 → 添加日期类型
   - 枚举字段未设置目标 → 添加目标枚举配置
   - 关联字段未设置目标 → 添加目标表和字段配置

4. **命名规范**
   - 字段名称重复 → 重命名重复字段
   - 字段名称格式不正确 → 修正命名格式

## 注意事项

### 1. 网络依赖
- 自动修复功能需要网络连接
- 如果网络连接失败，会显示错误提示

### 2. AI 响应格式
- AI 必须返回有效的 JSON 格式数据
- 如果 AI 返回格式不正确，会提示手动修复

### 3. 数据安全
- 修复操作会直接更新数据库中的数据表定义
- 建议在重要操作前备份数据

### 4. 修复准确性
- AI 修复基于常见的数据库设计最佳实践
- 复杂业务逻辑可能需要人工审核
- 建议在应用修复后验证业务逻辑的正确性

## 故障排除

### 常见问题

1. **"自动修复功能未启用"**
   - 检查是否正确配置了 AI 服务
   - 确认 API 令牌是否有效

2. **"AI 返回的数据格式不正确"**
   - AI 可能返回了非 JSON 格式的响应
   - 检查网络连接和 AI 服务状态

3. **"自动修复失败"**
   - 检查网络连接
   - 查看浏览器控制台的详细错误信息

### 调试方法

1. 打开浏览器开发者工具
2. 查看 Console 标签页的错误信息
3. 查看 Network 标签页的 API 请求状态
4. 使用测试功能验证 AI 服务状态：

```javascript
// 在浏览器控制台中运行
import('./AIHelper/test').then(module => {
  module.runAllTests();
});
```

## 扩展功能

### 自定义修复规则

可以通过修改 `SchemaValidator` 组件中的 `handleAutoFix` 函数来自定义修复逻辑：

```typescript
const handleAutoFix = async () => {
  // 自定义提示词
  const customPrompt = `你的自定义提示词`;
  
  // 自定义响应处理
  const response = await getSchemaHelp(customPrompt);
  
  // 自定义修复逻辑
  // ...
};
```

### 批量修复

可以扩展功能支持批量修复多个数据表：

```typescript
const handleBatchAutoFix = async (schemas: SchemaListItem[]) => {
  for (const schema of schemas) {
    // 为每个数据表执行修复
    await handleAutoFix(schema);
  }
};
```

## 更新日志

- **v1.0.0**: 初始版本，支持基本的自动修复功能
- 集成 AI 服务进行智能修复
- 支持所有主要验证规则的自动修复
- 提供用户友好的界面和错误处理 