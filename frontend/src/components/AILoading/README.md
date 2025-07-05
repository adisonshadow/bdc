# AI 加载组件

## 功能概述

AI 加载组件用于在 AI 处理过程中显示全屏加载动画，提供良好的用户体验反馈。

## 特性

- 🎯 全屏覆盖：黑色半透明背景覆盖整个屏幕
- 🎨 动画效果：使用 Lottie 动画提供流畅的视觉反馈
- 📝 自定义文本：支持自定义加载提示文字
- ⚡ 轻量级：基于 lottie-react-web，性能优秀

## 使用方法

### 基本用法

```tsx
import AILoading from '@/components/AILoading';

const MyComponent = () => {
  const [isAILoading, setIsAILoading] = useState(false);

  const handleAITask = async () => {
    setIsAILoading(true);
    try {
      // AI 处理逻辑
      await aiService.process();
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    <>
      <AILoading visible={isAILoading} text="AI 正在思考中..." />
      {/* 其他组件内容 */}
    </>
  );
};
```

### 自定义文本

```tsx
<AILoading 
  visible={isGenerating} 
  text="AI 正在生成模型..." 
/>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| visible | boolean | - | 是否显示加载组件 |
| text | string | 'AI 正在思考中...' | 加载提示文字 |

## 样式定制

组件使用 Less 样式，可以通过修改 `index.less` 文件来自定义样式：

```less
.ai-loading-overlay {
  // 修改背景透明度
  background: rgba(0,0,0,0.6);
}

.ai-loading-text {
  // 修改文字样式
  font-size: 20px;
  color: #fff;
}
```

## 动画文件

组件使用 `@/assets/loading.json` 作为动画文件，确保该文件存在且格式正确。

## 最佳实践

1. **合理使用**：只在 AI 处理时间较长时使用
2. **文本提示**：提供清晰的进度提示
3. **错误处理**：确保在异常情况下也能正确隐藏
4. **性能考虑**：避免频繁显示/隐藏

## 注意事项

- 组件使用 `position: fixed` 定位，确保在最顶层显示
- z-index 设置为 2000，避免被其他元素遮挡
- 动画文件较大时建议进行压缩优化 