# AILoading 组件使用指南

## 概述

`AILoading` 组件是一个专门为 AI 处理过程设计的全屏加载组件，提供流畅的动画效果和清晰的用户反馈。

## 基本用法

### 1. 直接使用组件

```tsx
import React, { useState } from 'react';
import AILoading from '@/components/AILoading';

const MyComponent = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAITask = async () => {
    setIsLoading(true);
    try {
      // AI 处理逻辑
      await aiService.process();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AILoading visible={isLoading} text="AI 正在思考中..." />
      <button onClick={handleAITask}>开始 AI 处理</button>
    </>
  );
};
```

### 2. 使用 Hook 管理状态

```tsx
import React from 'react';
import AILoading from '@/components/AILoading';
import { useSimpleAILoading } from '@/components/AILoading/useAILoading';

const MyComponent = () => {
  const { isVisible, text, showLoading, hideLoading } = useSimpleAILoading();

  const handleAITask = async () => {
    showLoading('AI 正在分析数据...');
    try {
      await aiService.analyze();
    } finally {
      hideLoading();
    }
  };

  return (
    <>
      <AILoading visible={isVisible} text={text} />
      <button onClick={handleAITask}>开始分析</button>
    </>
  );
};
```

### 3. 使用高级 Hook

```tsx
import React from 'react';
import AILoading from '@/components/AILoading';
import { useAILoading } from '@/components/AILoading/useAILoading';

const MyComponent = () => {
  const { isVisible, text, withAILoading } = useAILoading({
    defaultText: 'AI 正在处理...',
    onStart: () => console.log('AI 处理开始'),
    onComplete: () => console.log('AI 处理完成'),
    onError: (error) => console.error('AI 处理失败:', error)
  });

  const handleAITask = async () => {
    await withAILoading(
      async () => {
        // AI 处理逻辑
        await aiService.process();
      },
      'AI 正在生成代码...'
    );
  };

  return (
    <>
      <AILoading visible={isVisible} text={text} />
      <button onClick={handleAITask}>开始处理</button>
    </>
  );
};
```

## 在 SchemaValidator 中的使用

```tsx
// 在 SchemaValidator 组件中集成 AILoading
import AILoading from '@/components/AILoading';
import { useSimpleAILoading } from '@/components/AILoading/useAILoading';

const SchemaValidator = ({ fields, onAutoFix }) => {
  const { isVisible, text, showLoading, hideLoading } = useSimpleAILoading();

  const handleAutoFix = async () => {
    showLoading('AI 正在分析并修复验证错误...');
    try {
      // AI 修复逻辑
      const result = await aiService.fixValidation(fields);
      onAutoFix(result);
    } finally {
      hideLoading();
    }
  };

  return (
    <>
      <AILoading visible={isVisible} text={text} />
      {/* 其他组件内容 */}
    </>
  );
};
```

## Props 说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| visible | boolean | - | 是否显示加载组件 |
| text | string | 'AI 正在思考中...' | 加载提示文字 |

## Hook API

### useSimpleAILoading()

返回简单的 AI 加载状态管理对象：

```tsx
const {
  isVisible,    // 是否显示加载
  text,         // 当前显示的文字
  showLoading,  // 显示加载 (text?: string)
  hideLoading   // 隐藏加载
} = useSimpleAILoading();
```

### useAILoading(options)

返回高级 AI 加载状态管理对象：

```tsx
const {
  isVisible,      // 是否显示加载
  text,           // 当前显示的文字
  startLoading,   // 开始加载 (text?: string)
  stopLoading,    // 停止加载
  withAILoading   // 包装异步函数
} = useAILoading({
  defaultText: 'AI 正在思考中...',
  onStart: () => {},
  onComplete: () => {},
  onError: (error) => {}
});
```

## 最佳实践

### 1. 合理使用时机

- ✅ 适合：AI 处理时间超过 1 秒的场景
- ❌ 不适合：快速响应的操作（< 500ms）

### 2. 提供清晰的提示文字

```tsx
// ✅ 好的示例
<AILoading text="AI 正在分析数据模型..." />

// ❌ 不好的示例
<AILoading text="处理中..." />
```

### 3. 错误处理

```tsx
const handleAITask = async () => {
  showLoading('AI 正在处理...');
  try {
    await aiService.process();
  } catch (error) {
    // 错误处理
    message.error('处理失败');
  } finally {
    hideLoading(); // 确保总是隐藏
  }
};
```

### 4. 避免频繁切换

```tsx
// ✅ 好的示例
const handleTask = async () => {
  showLoading('AI 正在处理...');
  await longRunningTask();
  hideLoading();
};

// ❌ 不好的示例
const handleTask = async () => {
  showLoading('步骤1...');
  await step1();
  hideLoading();
  showLoading('步骤2...'); // 频繁切换
  await step2();
  hideLoading();
};
```

## 样式定制

可以通过修改 `index.less` 文件来自定义样式：

```less
.ai-loading-overlay {
  // 修改背景透明度
  background: rgba(0,0,0,0.6);
}

.ai-loading-text {
  // 修改文字样式
  font-size: 20px;
  color: #fff;
  font-weight: 500;
}
```

## 注意事项

1. **性能考虑**：组件使用 Lottie 动画，确保动画文件已优化
2. **层级管理**：组件使用 `z-index: 999999`，确保在最顶层显示
3. **响应式设计**：组件会自动适应不同屏幕尺寸
4. **无障碍访问**：建议为屏幕阅读器添加适当的 ARIA 标签

## 示例项目

查看 `example.tsx` 文件获取完整的使用示例。 