// 枚举修复提示词生成器
// 专门用于生成枚举修复相关的AI提示词

export interface EnumFixContext {
  // 当前枚举数据
  currentEnum?: {
    code?: string;
    name?: string;
    description?: string;
    options?: Array<{ value: string; label: string; description?: string; order?: number }>;
    isActive?: boolean;
  };
  // 验证错误
  validationIssues?: Array<{
    type: 'error' | 'warning';
    field: string;
    message: string;
    details?: any;
  }>;
  // 用户需求描述
  userRequirement?: string;
}

export interface EnumFixPromptOptions {
  // 操作类型
  operationType: 'fix' | 'optimize' | 'create';
  // 是否包含优化说明
  includeOptimizationNotes?: boolean;
}

/**
 * 生成枚举修复提示词
 */
export function generateEnumFixPrompt(
  context: EnumFixContext,
  options: EnumFixPromptOptions
): string {
  const {
    operationType,
    includeOptimizationNotes = false
  } = options;

  // 基础规则部分
  const baseRules = generateEnumBaseRules();
  
  // 根据操作类型生成不同的提示词
  switch (operationType) {
    case 'fix':
      return generateFixPrompt(context, baseRules);
    case 'optimize':
      return generateOptimizePrompt(context, baseRules, includeOptimizationNotes);
    case 'create':
      return generateCreatePrompt(context, baseRules);
    default:
      throw new Error(`不支持的操作类型: ${operationType}`);
  }
}

/**
 * 生成基础规则
 */
function generateEnumBaseRules(): string {
  return `## 枚举设计规则

### 枚举基本信息规则:
1. **code**: 枚举代码，必须以字母开头，只能包含字母、数字、下划线和冒号
   - 支持多级命名，使用冒号分隔，如：system:user:status
   - 示例：user_status, system:gender, order:payment_method
2. **name**: 枚举名称，必须以小写字母开头，只能包含小写字母、数字和下划线
   - 示例：user_status, gender, payment_method
3. **description**: 枚举描述，可选字段
4. **isActive**: 是否启用，默认为true

### 枚举选项规则:
1. **value**: 枚举值，只能包含小写字母、数字和下划线
   - 示例：active, inactive, pending, approved
2. **label**: 显示标签，用于用户界面显示
   - 示例：激活, 未激活, 待处理, 已批准
3. **description**: 选项描述，可选字段
4. **order**: 排序号，可选字段，数字类型，越小越靠前

### 验证规则:
1. 枚举代码不能为空
2. 枚举名称不能为空
3. 枚举选项的value不能为空
4. 枚举选项的label不能为空
5. 枚举选项的value必须唯一，不能重复
6. 枚举选项的label可以重复，但建议保持唯一
7. 枚举选项的order必须是数字类型，且不能为负数
8. 枚举选项的order不能重复（如果设置了order）

### 最佳实践:
1. 枚举代码应该具有业务含义，便于理解和维护
2. 枚举值应该简洁明了，使用英文
3. 显示标签应该使用中文，便于用户理解
4. 建议为每个选项添加描述，提高可读性
5. 使用order字段控制选项的显示顺序
6. 枚举选项数量建议控制在20个以内，过多会影响性能`;
}

/**
 * 生成修复提示词
 */
function generateFixPrompt(
  context: EnumFixContext,
  baseRules: string
): string {
  const { currentEnum, validationIssues = [] } = context;
  
  const currentEnumInfo = currentEnum ? `
## 当前枚举信息
- 代码: ${currentEnum.code || '未设置'}
- 名称: ${currentEnum.name || '未设置'}
- 描述: ${currentEnum.description || '未设置'}
- 选项数量: ${currentEnum.options?.length || 0}
- 启用状态: ${currentEnum.isActive !== false ? '启用' : '禁用'}

${currentEnum.options && currentEnum.options.length > 0 ? `
## 当前选项
${currentEnum.options.map((option, index) => 
  `${index + 1}. value: "${option.value || '未设置'}", label: "${option.label || '未设置'}"${option.description ? `, description: "${option.description}"` : ''}${typeof option.order === 'number' ? `, order: ${option.order}` : ''}`
).join('\n')}` : ''}` : '';

  const validationIssuesInfo = validationIssues.length > 0 ? `
## 验证错误
${validationIssues.map((issue, index) => 
  `${index + 1}. [${issue.type === 'error' ? '错误' : '警告'}] ${issue.message}${issue.details ? ` (${issue.details})` : ''}`
).join('\n')}` : '';

  return `请根据以下验证错误修复枚举数据：

${currentEnumInfo}${validationIssuesInfo}

${baseRules}

请修复上述验证错误，返回修复后的完整枚举数据。

请返回 JSON 格式的数据：
{
  "code": "修复后的枚举代码",
  "name": "修复后的枚举名称", 
  "description": "修复后的枚举描述",
  "isActive": true/false,
  "options": [
    {
      "value": "修复后的枚举值",
      "label": "修复后的显示标签",
      "description": "选项描述（可选）",
      "order": 1 // 排序号（可选，数字，越小越靠前）
    }
  ]
}

修复要求：
1. 修复所有验证错误
2. 保持原有的业务逻辑和含义
3. 确保所有字段符合规则要求
4. 如果当前数据不完整，请根据业务含义补充合理的默认值`;
}

/**
 * 生成优化提示词
 */
function generateOptimizePrompt(
  context: EnumFixContext,
  baseRules: string,
  includeOptimizationNotes: boolean
): string {
  const { currentEnum, validationIssues = [] } = context;
  
  const currentEnumInfo = currentEnum ? `
## 当前枚举信息
- 代码: ${currentEnum.code || '未设置'}
- 名称: ${currentEnum.name || '未设置'}
- 描述: ${currentEnum.description || '未设置'}
- 选项数量: ${currentEnum.options?.length || 0}
- 启用状态: ${currentEnum.isActive !== false ? '启用' : '禁用'}

${currentEnum.options && currentEnum.options.length > 0 ? `
## 当前选项
${currentEnum.options.map((option, index) => 
  `${index + 1}. value: "${option.value || '未设置'}", label: "${option.label || '未设置'}"${option.description ? `, description: "${option.description}"` : ''}${typeof option.order === 'number' ? `, order: ${option.order}` : ''}`
).join('\n')}` : ''}` : '';

  const validationIssuesInfo = validationIssues.length > 0 ? `
## 验证问题
${validationIssues.map((issue, index) => 
  `${index + 1}. [${issue.type === 'error' ? '错误' : '警告'}] ${issue.message}${issue.details ? ` (${issue.details})` : ''}`
).join('\n')}` : '';

  const optimizationNotes = includeOptimizationNotes ? `
## 优化建议
1. 检查枚举代码是否符合命名规范
2. 检查枚举名称是否简洁明了
3. 检查枚举选项是否完整且有意义
4. 检查选项的value是否规范
5. 检查选项的label是否用户友好
6. 检查是否需要添加选项描述
7. 检查选项排序是否合理
8. 检查是否有重复或冗余的选项` : '';

  return `请优化以下枚举数据：

${currentEnumInfo}${validationIssuesInfo}${optimizationNotes}

${baseRules}

请优化上述枚举数据，返回优化后的完整枚举数据。

请返回 JSON 格式的数据：
{
  "code": "优化后的枚举代码",
  "name": "优化后的枚举名称", 
  "description": "优化后的枚举描述",
  "isActive": true/false,
  "options": [
    {
      "value": "优化后的枚举值",
      "label": "优化后的显示标签",
      "description": "选项描述（可选）",
      "order": 1 // 排序号（可选，数字，越小越靠前）
    }
  ]
}

优化要求：
1. 修复所有验证错误
2. 提高代码的可读性和维护性
3. 确保选项的完整性和合理性
4. 优化选项的命名和描述
5. 确保符合最佳实践`;
}

/**
 * 生成创建提示词
 */
function generateCreatePrompt(
  context: EnumFixContext,
  baseRules: string
): string {
  const { userRequirement = '' } = context;
  
  return `请根据以下业务需求创建一个新的枚举：

业务描述：${userRequirement}

${baseRules}

请创建一个完整的枚举，包含：
1. 合适的枚举代码和名称（根据业务描述自动生成）
2. 详细的枚举描述
3. 完整的选项列表，严格按照上述规则配置

请返回 JSON 格式的数据：
{
  "code": "枚举代码（如：system:gender）",
  "name": "枚举名称（如：gender）", 
  "description": "枚举描述",
  "isActive": true,
  "options": [
    {
      "value": "枚举值",
      "label": "显示标签",
      "description": "选项描述（可选）",
      "order": 1 // 排序号（可选，数字，越小越靠前）
    }
  ]
}

创建要求：
1. 根据业务需求设计合适的选项
2. 确保所有字段符合规则要求
3. 选项应该覆盖所有可能的业务场景
4. 使用合理的命名和描述`;
} 