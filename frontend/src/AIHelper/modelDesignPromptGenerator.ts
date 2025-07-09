// 模型设计提问词生成器
// 专门用于生成数据模型设计相关的AI提示词

const KEY_INDEXES_TEMPLATE = `
  "keyIndexes": {
    "primaryKey": ["id"], // 单一主键示例, 也可以使用联合主键如 ["user_id", "role_id"]
    "indexes": [
      {
        "name": "索引名称", // 索引名称，不能是中文
        "fields": ["字段名"], // 索引字段，不能是中文
        "type": "unique|normal|fulltext|spatial" // 索引类型，必须为以下四种之一
      }
    ]
  }
`;

// 单个模型的JSON格式模板
const SINGLE_MODEL_JSON_TEMPLATE = `
  "name": "表的名称", // 必须是英文字母开头，只能包含小写字母、数字和下划线，不能是中文
  "code": "表的完整代码", // 只能包含小写字母、数字、下划线和冒号， 冒号表示多级，不能是中文
  "description": "表的详细描述", // 可选
  "fields": [
    {
      "id": "field_001",
      "name": "字段名", // 必须是英文字母开头，只能包含小写字母、数字和下划线，不能是中文
      "type": "字段类型", // 必须是上述11种类型之一
      "description": "字段描述", // 可选
      "required": true/false, // 可选, true/false
      "length": 长度（字符串类型必须设置）,
      "numberConfig": {
        "numberType": "integer|float|decimal",
        "precision": 10,
        "scale": 2
      },
      "dateConfig": {
        "dateType": "year|year-month|date|datetime"
      },
      "enumConfig": {
        "targetEnumCode": "现有枚举代码",
        "multiple": false,
        "defaultValues": []
      },
      "relationConfig": {
        "targetSchemaCode": "目标表代码",
        "targetField": "目标字段名",
        "multiple": false,
        "cascadeDelete": "restrict|cascade|setNull",
        "displayFields": ["name", "code"]
      },
      "mediaConfig": {
        "mediaType": "image|video|audio|document|file",
        "formats": ["jpg", "png"],
        "maxSize": 10,
        "multiple": false
      },
      "apiConfig": {
        "endpoint": "API地址",
        "method": "GET|POST|PUT|DELETE",
        "multiple": false,
        "params": {},
        "headers": {},
        "resultMapping": {}
      }
    }
  ],
  ${KEY_INDEXES_TEMPLATE}
`;

const NEW_ENUM_JSON_TEMPLATE = `\n  "newEnums": [
    {
      "code": "新枚举代码(如: system:gender)", // 只能包含小写字母、数字和下划线和冒号,冒号表示多级
      "name": "new_enum_name", // 必须以字母开头，只能包含小写字母、数字和下划线
      "description": "新枚举描述",
      "options": [
        {
          "value": "枚举值", // 只能包含小写字母、数字和下划线
          "label": "显示标签",
          "description": "选项描述（可选）",
          "order": 1 // 排序号（可选，数字，越小越靠前）
        }
      ]
    }
  ]`;

export interface ModelDesignContext {
  // 现有枚举列表
  existingEnums?: Array<{
    code: string;
    name: string;
    options?: Array<{ value: string; label: string; description?: string; order?: number }>;
  }>;
  // 已存在的表列表
  existingSchemas?: Array<{
    name: string;
    code: string;
    description?: string;
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
5. **number** - 数字类型, **必须**提供numberConfig配置:
   - numberType: 数字类型, 必须为以下三种之一:
     - integer(整数)
     - float(浮点数)
     - decimal(精确小数)
   - precision: 精度(用于float和decimal类型, 表示数字的总位数, 1-65)
   - scale: 小数位数(用于float和decimal类型, 表示小数点后的位数, 0-30, 且必须小于precision)
   **⚠️ 重要：number类型字段必须包含完整的numberConfig配置，不能省略！**
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
10. **media** - 媒体类型, 需要mediaConfig配置:
    - mediaType: 媒体类型, 必须为以下五种之一:
      - image(图片)
      - video(视频)
      - audio(音频)
      - document(文档)
      - file(文件)
    - formats: 允许的文件格式数组, 必须指定且不能为空数组, 如: ["jpg", "png", "pdf"]
    - maxSize: 最大文件大小限制(MB), 必须大于0
    - multiple: 是否允许多个媒体文件
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
  const { userRequirement = '', existingEnums = [], existingSchemas = [] } = context;
  
  const enumList = existingEnums.length > 0 
    ? `\n## 现有枚举列表\n${existingEnums.map(enumItem => 
        `- ${enumItem.code}: ${enumItem.name} (${enumItem.options?.map(opt => `${opt.value}:${opt.label}${opt.description ? '（' + opt.description + '）' : ''}${typeof opt.order === 'number' ? ' [排序:' + opt.order + ']' : ''}`).join(', ')})`
      ).join('\n')}`
    : '';

  const existingSchemasList = existingSchemas.length > 0
    ? `\n## 已存在的表（请勿重复创建）\n${existingSchemas.map(schema => 
        `- ${schema.code}: ${schema.name}${schema.description ? ` (${schema.description})` : ''}`
      ).join('\n')}`
    : '';

  const newEnumsSection = includeNewEnums 
    ? NEW_ENUM_JSON_TEMPLATE
    : '';

  return `请根据以下业务需求自动生成数据表模型：

业务描述：${userRequirement}${enumList}${existingSchemasList}

${baseRules}

请分析业务需求，如果需求中包含多个相关的数据表，请生成多个模型。例如：
- 用户管理系统：可能需要用户表、角色表、权限表等
- 电商系统：可能需要商品表、订单表、用户表、分类表等
- 内容管理系统：可能需要文章表、分类表、标签表、用户表等

**重要：如果识别出的模型数量≤2个，直接返回完整的模型结构。如果模型数量>2个，请返回模型清单和分批计划。**

请返回 JSON 格式的数据：

**如果模型数量≤2个，返回完整模型结构：**
{
${SINGLE_MODEL_JSON_TEMPLATE},
${newEnumsSection}
}

**如果模型数量>2个，返回模型清单：**
{
  "type": "batch_plan",
  "totalSchemas": 5,
  "schemaList": [
    {
      "name": "表的中文名称",
      "code": "表代码",
      "description": "表描述",
      "priority": 1, // 优先级：1=最高，2=中等，3=最低
      "dependencies": ["依赖的表代码"] // 依赖的其他表，如果没有则为空数组
    }
  ]
}

**注意事项：**
1. 模型数量>2个时，只返回模型清单，不返回具体字段
2. 按业务重要性设置优先级：核心业务表优先级=1，关联表优先级=2，扩展表优先级=3
3. 标注模型间的依赖关系，确保创建顺序正确
4. 每个模型只包含核心字段（5-8个字段），避免过于复杂
5. 优先使用现有枚举，必要时才创建新枚举
6. **重要：不要创建已存在的表，如果识别出的表已存在，请跳过它们**

**特别注意字段配置要求：**
- **数字类型字段（number）必须包含 numberConfig 配置**：
  "numberConfig": {
    "numberType": "integer|float|decimal",
    "precision": 10,
    "scale": 2
  }
- 字符串类型字段（string）必须设置 length 属性
- 日期类型字段（date）必须包含 dateConfig 配置
- 枚举类型字段（enum）必须包含 enumConfig 配置
- 关联类型字段（relation）必须包含 relationConfig 配置`;
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
        `- ${enumItem.code}: ${enumItem.name} (${enumItem.options?.map(opt => `${opt.value}:${opt.label}${opt.description ? '（' + opt.description + '）' : ''}${typeof opt.order === 'number' ? ' [排序:' + opt.order + ']' : ''}`).join(', ')})`
      ).join('\n')}`
    : '';

  const optimizationNotes = includeOptimizationNotes 
    ? ',\n  "optimizationNotes": "优化说明"'
    : '';

  const newEnumsSection = includeNewEnums 
    ? NEW_ENUM_JSON_TEMPLATE
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
  ${SINGLE_MODEL_JSON_TEMPLATE},
  ${optimizationNotes},
  ${newEnumsSection}
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
        `- ${enumItem.code}: ${enumItem.name} (${enumItem.options?.map(opt => `${opt.value}:${opt.label}${opt.description ? '（' + opt.description + '）' : ''}${typeof opt.order === 'number' ? ' [排序:' + opt.order + ']' : ''}`).join(', ')})`
      ).join('\n')}`
    : '';

  const newEnumsSection = includeNewEnums 
    ? NEW_ENUM_JSON_TEMPLATE
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
  "keyIndexes": {...},
  ${newEnumsSection}
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
        `- ${enumItem.code}: ${enumItem.name} (${enumItem.options?.map(opt => `${opt.value}:${opt.label}${opt.description ? '（' + opt.description + '）' : ''}${typeof opt.order === 'number' ? ' [排序:' + opt.order + ']' : ''}`).join(', ')})`
      ).join('\n')}`
    : '';

  const newEnumsSection = includeNewEnums 
    ? NEW_ENUM_JSON_TEMPLATE
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
  ${SINGLE_MODEL_JSON_TEMPLATE},
  ${newEnumsSection}
}

只返回 JSON 格式的数据，不要包含其他说明文字。`;
}

/**
 * 生成分批创建模型的提示词
 */
export function generateBatchCreatePrompt(
  context: {
    schemaList: Array<{
      name: string;
      code: string;
      description: string;
      priority: number;
      dependencies: string[];
    }>;
    currentBatchSchemas: Array<{
      name: string;
      code: string;
      description: string;
    }>;
    createdSchemas: Array<{
      name: string;
      code: string;
      fields: any[];
    }>;
    existingEnums: Array<{
      code: string;
      name: string;
      options?: Array<{ value: string; label: string; description?: string; order?: number }>;
    }>;
    existingSchemas?: Array<{
      name: string;
      code: string;
      description?: string;
    }>;
  },
  options: {
    includeNewEnums?: boolean;
  } = {}
): string {
  const { schemaList, currentBatchSchemas, createdSchemas, existingEnums, existingSchemas = [] } = context;
  const { includeNewEnums = true } = options;

  const enumList = existingEnums.length > 0 
    ? `\n## 现有枚举列表\n${existingEnums.map(enumItem => 
        `- ${enumItem.code}: ${enumItem.name} (${enumItem.options?.map(opt => `${opt.value}:${opt.label}${opt.description ? '（' + opt.description + '）' : ''}${typeof opt.order === 'number' ? ' [排序:' + opt.order + ']' : ''}`).join(', ')})`
      ).join('\n')}`
    : '';

  const newEnumsSection = includeNewEnums 
    ? NEW_ENUM_JSON_TEMPLATE
    : '';

  const createdSchemasList = createdSchemas.length > 0
    ? `\n## 已创建的模型\n${createdSchemas.map(schema => 
        `- ${schema.code}: ${schema.name} (字段: ${schema.fields.map(f => f.name).join(', ')})`
      ).join('\n')}`
    : '';

  const existingSchemasList = existingSchemas.length > 0
    ? `\n## 已存在的模型（请勿重复创建）\n${existingSchemas.map(schema => 
        `- ${schema.code}: ${schema.name}${schema.description ? ` (${schema.description})` : ''}`
      ).join('\n')}`
    : '';

  const baseRules = generateBaseRules();

  return `请根据以下模型信息生成完整的模型结构：

## 当前批次需要创建的模型
${currentBatchSchemas.map(schema => 
  `- ${schema.code}: ${schema.name} (${schema.description})`
).join('\n')}${createdSchemasList}${existingSchemasList}${enumList}

${baseRules}

**重要要求：**
1. 只生成当前批次这${currentBatchSchemas.length}个模型的具体结构
2. 考虑与已创建模型的关联关系
3. 每个模型只包含核心字段（5-8个字段），避免过于复杂
4. 优先使用现有枚举，必要时才创建新枚举
5. 确保字段类型和配置符合规则要求
6. **重要：不要创建已存在的模型，如果当前批次中有已存在的模型，请跳过它们**

**特别注意字段配置要求：**
- **数字类型字段（number）必须包含 numberConfig 配置**：
  "numberConfig": {
    "numberType": "integer|float|decimal",
    "precision": 10,
    "scale": 2
  }
- 字符串类型字段（string）必须设置 length 属性
- 日期类型字段（date）必须包含 dateConfig 配置
- 枚举类型字段（enum）必须包含 enumConfig 配置
- 关联类型字段（relation）必须包含 relationConfig 配置

请返回 JSON 格式的数据：

{
  "schemas": [
    {
      ${SINGLE_MODEL_JSON_TEMPLATE}
    }
  ]${newEnumsSection}
}`;
}