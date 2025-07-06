# SchemaValidator 组件

## 简介

SchemaValidator 是一个用于验证数据表结构的 React 组件，提供实时的模型验证功能，帮助开发者及时发现和修复数据表设计中的问题。

## 特性

- ✅ **实时验证**: 在字段变化、索引设置时自动触发验证
- ✅ **分类显示**: 将问题分为错误和警告两类
- ✅ **详细反馈**: 提供具体的问题描述和修复建议
- ✅ **可视化展示**: 通过徽章和悬停提示展示验证结果
- ✅ **可扩展**: 支持自定义验证规则

## 快速开始

### 1. 基本使用

```tsx
import SchemaValidator from '@/components/SchemaValidator';

function MyComponent() {
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [schemas, setSchemas] = useState([]);
  const [enums, setEnums] = useState([]);

  return (
    <div>
      <SchemaValidator
        fields={selectedSchema?.fields ?? []}
        schemas={schemas}
        keyIndexes={selectedSchema?.keyIndexes}
        enums={enums}
        onValidationChange={(issues) => {
          console.log('验证问题:', issues);
        }}
      />
    </div>
  );
}
```

### 2. 在 SchemaManagement 中的使用

```tsx
// 在 SchemaManagement 页面中
<SchemaValidator
  fields={selectedSchema?.fields ?? []}
  schemas={schemas}
  keyIndexes={selectedSchema?.keyIndexes}
  enums={enums}
  onValidationChange={(issues) => {
    // 处理验证结果
    const { errors, warnings } = groupIssuesByType(issues);
    if (errors.length > 0) {
      console.log('发现错误:', errors);
    }
    if (warnings.length > 0) {
      console.log('发现警告:', warnings);
    }
  }}
/>
```

## 验证规则

### 错误类型 (必须修复)

1. **主键允许空值**: 主键字段不能设置为可选
2. **唯一索引允许空值**: 唯一索引字段建议设置为必填
3. **全文索引字段类型不合适**: 全文索引只适用于文本类型字段
4. **空间索引字段类型不合适**: 空间索引只适用于字符串类型字段
5. **枚举字段未设置目标**: 枚举字段必须指定目标枚举对象
6. **关联字段未设置目标**: 关联字段必须指定目标数据表和字段
7. **字段名称重复**: 同一数据表中不能有重复的字段名称
8. **字段名称格式不正确**: 字段名必须符合命名规范
9. **字符串字段未设置长度**: 字符串字段必须设置长度限制
10. **日期字段未设置类型**: 日期字段必须指定日期格式

### 警告类型 (建议修复)

1. **缺少主键**: 数据表应该设置主键字段
2. **主键字段类型不合适**: 某些字段类型不适合作为主键（联合主键且包含理想类型时除外）

## API 参考

### Props

| 属性 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `fields` | `Field[]` | ✅ | 要验证的字段数组 |
| `schemas` | `SchemaListItem[]` | ❌ | 所有数据表列表（用于关联字段验证） |
| `keyIndexes` | `KeyIndexes` | ❌ | 当前数据表的索引配置 |
| `enums` | `Enum[]` | ❌ | 所有枚举列表（用于枚举字段验证） |
| `onValidationChange` | `(issues: ValidationIssue[]) => void` | ❌ | 验证结果变化时的回调函数 |

### 类型定义

```typescript
interface KeyIndexes {
  primaryKey?: string[];
  indexes?: {
    name?: string;
    fields?: string[];
    type?: "unique" | "normal" | "fulltext" | "spatial";
  }[];
}

interface ValidationIssue {
  ruleId: string;
  type: 'error' | 'warning';
  message: string;
  fieldName?: string;
  fieldType?: string;
  details?: string;
}
```

## 验证触发时机

1. **组件初始化**: 组件挂载后自动执行验证
2. **字段变化**: 当 `fields` 数组发生变化时自动重新验证
3. **索引变化**: 当 `keyIndexes` 发生变化时自动重新验证
4. **依赖项变化**: 当 `schemas` 或 `enums` 发生变化时自动重新验证

## 验证结果展示

### 验证通过
- 显示绿色"验证通过"标签

### 验证未通过
- 显示红色"验证未通过"标签
- 标签上显示错误和警告的数量徽章
- 鼠标悬停显示详细的问题列表
- 问题按错误和警告分组显示

## 自定义验证规则

如需添加自定义验证规则，请参考 `rules.ts` 文件中的规则定义格式：

```typescript
{
  id: 'custom-rule',
  type: 'error' | 'warning',
  name: '自定义规则',
  description: '规则描述',
  validator: (fields, schemas, keyIndexes, enums) => {
    const issues: ValidationIssue[] = [];
    // 验证逻辑
    return issues;
  }
}
```

## 最佳实践

1. **及时修复错误**: 错误类型的问题会影响数据表的正常使用，应优先修复
2. **关注警告**: 警告类型的问题虽然不会阻止使用，但建议修复以获得最佳性能
3. **定期验证**: 在开发过程中定期检查验证结果，避免问题累积
4. **团队协作**: 将验证规则作为团队代码规范的一部分

## 故障排除

### 常见问题

1. **验证器不显示**: 检查 `fields` 数组是否为空
2. **验证结果不更新**: 确保传入的 props 正确更新
3. **类型错误**: 检查 TypeScript 类型定义是否正确

### 调试技巧

```tsx
<SchemaValidator
  fields={selectedSchema?.fields ?? []}
  schemas={schemas}
  keyIndexes={selectedSchema?.keyIndexes}
  enums={enums}
  onValidationChange={(issues) => {
    // 添加调试日志
    console.log('验证问题详情:', issues);
    console.log('当前字段:', selectedSchema?.fields);
    console.log('当前索引:', selectedSchema?.keyIndexes);
  }}
/>
``` 