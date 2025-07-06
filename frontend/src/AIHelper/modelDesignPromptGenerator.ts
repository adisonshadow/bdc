// 模型设计提问词生成器
// 专门用于生成数据模型设计相关的AI提示词

export interface ModelDesignContext {
  // 现有枚举列表
  existingEnums?: Array<{
    code: string;
    name: string;
    options?: Array<{ value: string; label: string }>;
  }>;
  // 当前模型（用于修复和优化）
  currentModel?: {
    name?: string;
    code?: string;
    description?: string;
    fields?: any[];
    keyIndexes?: any;
  };
  // 验证错误（用于修复）
  validationIssues?: Array<{
    type: string;
    message: string;
    fieldName?: string;
    details?: string;
  }>;
  // 用户需求描述
  userRequirement?: string;
  // 修改要求
  modifyRequirement?: string;
}

export interface ModelDesignPromptOptions {
  // 操作类型
  operationType: 'create' | 'optimize' | 'fix' | 'modify';
  // 是否包含新枚举
  includeNewEnums?: boolean;
  // 是否包含优化说明
  includeOptimizationNotes?: boolean;
}

/**
 * 生成模型设计提问词
 */
export function generateModelDesignPrompt(
  context: ModelDesignContext,
  options: ModelDesignPromptOptions
): string {
  const {
    operationType,
    includeNewEnums = false,
    includeOptimizationNotes = false
  } = options;

  // 基础规则部分
  const baseRules = generateBaseRules();
  
  // 根据操作类型生成不同的提示词
  switch (operationType) {
    case 'create':
      return generateCreatePrompt(context, baseRules, includeNewEnums);
    case 'optimize':
      return generateOptimizePrompt(context, baseRules, includeOptimizationNotes, includeNewEnums);
    case 'fix':
      return generateFixPrompt(context, baseRules, includeNewEnums);
    case 'modify':
      return generateModifyPrompt(context, baseRules, includeNewEnums);
    default:
      throw new Error(`不支持的操作类型: ${operationType}`);
  }
}

/**
 * 生成基础规则
 */
function generateBaseRules(): string {
  return `## 数据模型规则

### 支持的字段类型(严格限制, 只能使用以下11种类型):
1. **uuid** - UUID类型, 用于主键, 自动生成
2. **auto_increment** - 自增长ID, 用于主键
3. **string** - 字符串类型, 必须设置length(1-255)
4. **text** - 长文本类型, 无长度限制
5. **number** - 数字类型, 需要numberConfig配置:
   - numberType: 数字类型, 必须为以下三种之一:
     - integer(整数)
     - float(浮点数)
     - decimal(精确小数)
   - precision: 精度(用于float和decimal类型, 表示数字的总位数, 1-65)
   - scale: 小数位数(用于float和decimal类型, 表示小数点后的位数, 0-30, 且必须小于precision)
6. **boolean** - 布尔类型(true/false)
7. **date** - 日期类型, 必须设置dateConfig.dateType, 且只能为以下四种之一:
   - year(年)
   - year-month(年月)
   - date(年月日)
   - datetime(年月日时间)
8. **enum** - 枚举类型, 需要enumConfig配置
   - 如果现有枚举中有合适的, 使用 targetEnumCode 指向现有枚举
   - 如果没有合适的, 需要新建枚举, 在 newEnums 数组中提供新枚举定义
9. **relation** - 关联类型, 需要relationConfig配置
10. **media** - 媒体类型, 需要mediaConfig配置
11. **api** - API数据源类型, 需要apiConfig配置

⚠️ 重要: 字段类型必须严格使用上述11种类型之一, 不能使用其他任何类型(如timestamp, datetime等).

### 字段命名规则:
- 字段名必须以小写字母开头
- 只能包含小写字母, 数字和下划线
- 示例: user_name, email_address, created_at

### 必填字段配置:
- 每个字段必须有 id, name, type, required 属性
- 字符串类型必须设置 length
- 数字类型必须设置 numberConfig, 包含 numberType, precision, scale
- 日期类型必须设置 dateConfig.dateType
- 枚举类型需要 enumConfig
- 关联类型需要 relationConfig
- 媒体类型需要 mediaConfig
- API类型需要 apiConfig

### 系统字段建议:
- id: uuid类型, 作为主键
- created_at: date类型, datetime格式, 记录创建时间
- updated_at: date类型, datetime格式, 记录更新时间

### 主键和索引规则:
- 每个表必须有主键(primary), 通常使用 id 字段(uuid类型), 主键的 required 必须为true
- 主键字段类型限制: 只允许 uuid, auto_increment, string, number 类型字段作为主键
- 支持联合主键: 可以将多个字段组合作为主键, 适用于需要多个字段组合来唯一标识记录的场景
- 根据业务需求设置合适的索引:
  - 主键(primary): 用于唯一标识记录, 每个表必须有主键(可以是单一主键或联合主键)
  - 唯一索引(unique): 用于唯一性约束(如邮箱, 手机号, 用户名)
  - 普通索引(normal): 用于查询优化(如状态, 分类, 创建时间)
  - 全文索引(fulltext): 用于文本搜索优化, 仅适用于 text, string 类型字段
  - 空间索引(spatial): 用于地理空间数据查询, 适用于存储几何数据的字段
- 索引字段类型限制:
  - 主键: 只允许 uuid, auto_increment, string, number 类型
  - 全文索引: 只允许 text, string 类型
  - 空间索引: 只允许 string 类型(存储几何数据)
  - 唯一索引和普通索引: 适用于所有字段类型`;
}

/**
 * 生成创建模型的提示词
 */
function generateCreatePrompt(
  context: ModelDesignContext,
  baseRules: string,
  includeNewEnums: boolean
): string {
  const { userRequirement = '', existingEnums = [] } = context;
  
  const enumList = existingEnums.length > 0 
    ? `\n## 现有枚举列表\n${existingEnums.map(enumItem => 
        `- ${enumItem.code}: ${enumItem.name} (${enumItem.options?.map(opt => `${opt.value}:${opt.label}`).join(', ')})`
      ).join('\n')}`
    : '';

  const newEnumsSection = includeNewEnums 
    ? `\n  "newEnums": [
    {
      "code": "新枚举代码(如: system:gender)", // 必须以字母开头, 只能包含小写字母、数字和下划线和冒号,冒号表示多级
      "name": "new_enum_name", // 必须以字母开头，只能包含小写字母、数字和下划线
      "description": "新枚举描述",
      "options": [
        {
          "value": "枚举值", // 枚举值必须唯一, 不能重复,必须以字母开头，只能包含小写字母、数字和下划线
          "label": "显示标签"
        }
      ]
    }
  ]`
    : '';

  return `请根据以下业务需求自动生成一个数据表模型：

业务描述：${userRequirement}${enumList}

${baseRules}

请生成一个完整的数据表模型，包含：
1. 合适的表名和代码（根据业务描述自动生成，支持多级命名如：enterprise:user_profile）
2. 详细的表描述
3. 完整的字段列表，严格按照上述规则配置
4. 主键和索引配置

请返回 JSON 格式的数据：
{
  "name": "表的中文名称（如：企业用户信息表）",
  "code": "表的完整代码（如：enterprise:user_profile，支持多级命名）",
  "description": "表的详细描述",
  "fields": [
    {
      "id": "field_001",
      "name": "字段名",
      "type": "字段类型",
      "description": "字段描述",
      "required": true/false,
      "length": 长度（字符串类型必须设置）
    }
  ],
  "keyIndexes": {
    "primaryKey": ["id"], // 单一主键示例, 也可以使用联合主键如 ["user_id", "role_id"]
    "indexes": [
      {
        "name": "idx_email",
        "fields": ["email"],
        "type": "unique"
      },
      {
        "name": "idx_status",
        "fields": ["status"],
        "type": "normal"
      },
      {
        "name": "idx_content",
        "fields": ["content"],
        "type": "fulltext"
      },
      {
        "name": "idx_location",
        "fields": ["location"],
        "type": "spatial"
      }
    ]
  }${newEnumsSection}
}

注意：
- 字符串字段必须设置length属性
- 数字字段必须设置numberConfig，包含numberType、precision、scale
- 日期字段必须设置dateConfig.dateType属性，且dateType只能为 year、year-month、date、datetime 之一，禁止使用其他值
- 字段类型必须是上述11种类型之一
- 字段名必须符合命名规则
- 索引类型限制：
  - 主键：只允许 uuid, auto_increment, string, number 类型字段
  - 全文索引：只允许 text, string 类型字段
  - 空间索引：只允许 string 类型字段
  - 唯一索引和普通索引：适用于所有字段类型

只返回 JSON 格式的数据，不要包含其他说明文字。`;
}

/**
 * 生成优化模型的提示词
 */
function generateOptimizePrompt(
  context: ModelDesignContext,
  baseRules: string,
  includeOptimizationNotes: boolean,
  includeNewEnums: boolean = true
): string {
  const { currentModel, userRequirement = '', existingEnums = [] } = context;
  
  const enumList = existingEnums.length > 0 
    ? `\n## 现有枚举列表\n${existingEnums.map(enumItem => 
        `- ${enumItem.code}: ${enumItem.name} (${enumItem.options?.map(opt => `${opt.value}:${opt.label}`).join(', ')})`
      ).join('\n')}`
    : '';

  const optimizationNotes = includeOptimizationNotes 
    ? ',\n  "optimizationNotes": "优化说明"'
    : '';

  const newEnumsSection = includeNewEnums 
    ? `\n  "newEnums": [
    {
      "code": "新枚举代码（如：system:gender）",
      "name": "新枚举名称",
      "description": "新枚举描述",
      "options": [
        {
          "value": "枚举值",
          "label": "显示标签"
        }
      ]
    }
  ]`
    : '';

  return `请帮我${userRequirement ? '根据用户建议' : '自动'}优化这个数据模型。以下是当前模型的信息：

当前数据模型：
- 名称：${currentModel?.name || ''}
- 代码：${currentModel?.code || ''}
- 描述：${currentModel?.description || ''}
- 字段列表：${JSON.stringify(currentModel?.fields || [], null, 2)}${userRequirement ? `\n\n用户建议：\n${userRequirement}` : ''}${enumList}

${baseRules}

请进行以下优化：
1. 检查字段命名是否规范
2. 检查字段类型是否合适
3. 检查是否缺少必要的字段
4. 检查关联关系是否合理
5. 检查索引设置是否优化
6. 提供性能优化建议
7. 如果枚举字段指向的枚举不存在，请在 newEnums 中创建新的枚举定义

特别注意：
- 日期字段必须使用 dateConfig.dateType 结构，不能直接使用 dateType 属性
- 字符串字段必须设置 length 属性
- 数字字段必须设置 numberConfig 结构
- 枚举字段必须设置 enumConfig 结构
- 关联字段必须设置 relationConfig 结构

请返回优化后的完整模型配置，格式为 JSON：
{
  "name": "优化后的模型名称",
  "code": "优化后的模型代码",
  "description": "优化后的模型描述",
  "fields": [...],
  "keyIndexes": {
    "primaryKey": ["字段名1", "字段名2"],
    "indexes": [
      {
        "name": "idx_unique_field",
        "fields": ["字段名1"],
        "type": "unique"
      },
      {
        "name": "idx_normal_field",
        "fields": ["字段名2"],
        "type": "normal"
      },
      {
        "name": "idx_fulltext_field",
        "fields": ["文本字段"],
        "type": "fulltext"
      },
      {
        "name": "idx_spatial_field",
        "fields": ["空间字段"],
        "type": "spatial"
      }
    ]
  }${optimizationNotes}${newEnumsSection}
}

只返回 JSON 格式的数据，不要包含其他说明文字。`;
}

/**
 * 生成修复模型的提示词
 */
function generateFixPrompt(
  context: ModelDesignContext,
  baseRules: string,
  includeNewEnums: boolean = true
): string {
  const { currentModel, validationIssues = [], existingEnums = [] } = context;
  
  const enumList = existingEnums.length > 0 
    ? `\n## 现有枚举列表\n${existingEnums.map(enumItem => 
        `- ${enumItem.code}: ${enumItem.name} (${enumItem.options?.map(opt => `${opt.value}:${opt.label}`).join(', ')})`
      ).join('\n')}`
    : '';

  const newEnumsSection = includeNewEnums 
    ? `\n  "newEnums": [
    {
      "code": "新枚举代码（如：system:gender）",
      "name": "新枚举名称",
      "description": "新枚举描述",
      "options": [
        {
          "value": "枚举值",
          "label": "显示标签"
        }
      ]
    }
  ]`
    : '';

  return `请帮我修复这个数据模型中的验证错误。以下是当前的模型定义和验证错误：

当前模型：
${JSON.stringify(currentModel, null, 2)}

验证错误：
${validationIssues.map(issue => `- ${issue.type}: ${issue.message}${issue.details ? ` (${issue.details})` : ''}`).join('\n')}${enumList}

${baseRules}

请修复所有验证错误，包括：
1. 字段类型错误
2. 字段命名不规范
3. 缺少必要配置
4. 枚举字段指向不存在的枚举（如果枚举不存在，请在 newEnums 中创建新的枚举定义）
5. 索引配置错误

特别注意：
- 日期字段必须使用 dateConfig.dateType 结构，不能直接使用 dateType 属性
- 字符串字段必须设置 length 属性
- 数字字段必须设置 numberConfig 结构
- 枚举字段必须设置 enumConfig 结构
- 关联字段必须设置 relationConfig 结构

请返回修复后的完整模型 JSON，格式如下：
{
  "fields": [...],
  "keyIndexes": {...}${newEnumsSection}
}

只返回 JSON 格式的数据，不要包含其他说明文字。`;
}

/**
 * 生成修改模型的提示词
 */
function generateModifyPrompt(
  context: ModelDesignContext,
  baseRules: string,
  includeNewEnums: boolean = true
): string {
  const { currentModel, modifyRequirement = '', existingEnums = [] } = context;
  
  const enumList = existingEnums.length > 0 
    ? `\n## 现有枚举列表\n${existingEnums.map(enumItem => 
        `- ${enumItem.code}: ${enumItem.name} (${enumItem.options?.map(opt => `${opt.value}:${opt.label}`).join(', ')})`
      ).join('\n')}`
    : '';

  const newEnumsSection = includeNewEnums 
    ? `\n  "newEnums": [
    {
      "code": "新枚举代码（如：system:gender）",
      "name": "新枚举名称",
      "description": "新枚举描述",
      "options": [
        {
          "value": "枚举值",
          "label": "显示标签"
        }
      ]
    }
  ]`
    : '';

  return `请根据以下要求修改现有的数据模型：

原始模型：
${JSON.stringify(currentModel, null, 2)}

修改要求：${modifyRequirement}${enumList}

${baseRules}

请根据修改要求重新生成完整的数据模型，保持原有的字段类型和配置规则。如果修改过程中需要新的枚举，请在 newEnums 中创建。

特别注意：
- 日期字段必须使用 dateConfig.dateType 结构，不能直接使用 dateType 属性
- 字符串字段必须设置 length 属性
- 数字字段必须设置 numberConfig 结构
- 枚举字段必须设置 enumConfig 结构
- 关联字段必须设置 relationConfig 结构

请返回 JSON 格式的数据：
{
  "name": "表的中文名称",
  "code": "表的完整代码",
  "description": "表的详细描述",
  "fields": [
    {
      "id": "field_001",
      "name": "字段名",
      "type": "字段类型",
      "description": "字段描述",
      "required": true/false,
      "length": 长度（字符串类型必须设置）
    }
  ],
  "keyIndexes": {
    "primaryKey": ["id"], // 单一主键示例, 也可以使用联合主键如 ["user_id", "role_id"]
    "indexes": [
      {
        "name": "idx_email",
        "fields": ["email"],
        "type": "unique"
      },
      {
        "name": "idx_status",
        "fields": ["status"],
        "type": "normal"
      },
      {
        "name": "idx_content",
        "fields": ["content"],
        "type": "fulltext"
      },
      {
        "name": "idx_location",
        "fields": ["location"],
        "type": "spatial"
      }
    ]
  }${newEnumsSection}
}

只返回 JSON 格式的数据，不要包含其他说明文字。`;
} 