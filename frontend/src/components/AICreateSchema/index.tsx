import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Spin, Space, Typography, Card, Tag } from 'antd';
import { RobotOutlined, CheckOutlined, EditOutlined } from '@ant-design/icons';
import { getSchemaHelp } from '@/AIHelper';
import type { Field } from '@/components/SchemaValidator/types';
import AILoading from '@/components/AILoading';
import { getEnums, postEnums } from '@/services/BDC/api/enumManagement';

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

interface AICreateSchemaProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (schemaData: {
    name: string;
    code: string;
    description: string;
    fields: Field[];
    keyIndexes?: {
      primaryKey?: string[];
      indexes?: {
        name?: string;
        fields?: string[];
        type?: "unique" | "index" | "fulltext" | "spatial";
      }[];
    };
  }) => void;
}

interface GeneratedSchema {
  name: string;
  code: string;
  description: string;
  fields: Field[];
  keyIndexes?: {
    primaryKey?: string[];
    indexes?: {
      name?: string;
      fields?: string[];
      type?: "unique" | "index" | "fulltext" | "spatial";
    }[];
  };
}

const AICreateSchema: React.FC<AICreateSchemaProps> = ({
  open,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSchema, setGeneratedSchema] = useState<GeneratedSchema | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [modifyInput, setModifyInput] = useState('');
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [existingEnums, setExistingEnums] = useState<API.Enum[]>([]);
  const [newEnums, setNewEnums] = useState<API.Enum[]>([]);

  // 获取现有枚举列表
  const fetchExistingEnums = async () => {
    try {
      const enums = await getEnums({});
      setExistingEnums(enums);
    } catch (error) {
      console.error('获取枚举列表失败:', error);
    }
  };

  // 组件挂载时获取枚举列表
  useEffect(() => {
    if (open) {
      fetchExistingEnums();
    }
  }, [open]);

  // 生成模型
  const handleGenerate = async () => {
    try {
      const values = await form.validateFields();
      setIsGenerating(true);
      setIsAILoading(true);

      const prompt = `请根据以下业务需求自动生成一个数据表模型：

业务描述：${values.description}

## 现有枚举列表
${existingEnums.map(enumItem => `- ${enumItem.code}: ${enumItem.name} (${enumItem.options?.map(opt => `${opt.value}:${opt.label}`).join(', ')})`).join('\n')}

## 数据模型规则

### 支持的字段类型：
1. **uuid** - UUID类型，用于主键，自动生成
2. **auto_increment** - 自增长ID，用于主键
3. **string** - 字符串类型，必须设置length（1-255）
4. **text** - 长文本类型，无长度限制
5. **number** - 数字类型（整数或小数）
6. **boolean** - 布尔类型（true/false）
7. **date** - 日期类型，必须设置dateType（year/year-month/date/datetime）
8. **enum** - 枚举类型，需要enumConfig配置
   - 如果现有枚举中有合适的，使用 targetEnumCode 指向现有枚举
   - 如果没有合适的，需要新建枚举，在 newEnums 数组中提供新枚举定义
9. **relation** - 关联类型，需要relationConfig配置
10. **media** - 媒体类型，需要mediaConfig配置
11. **api** - API数据源类型，需要apiConfig配置

### 字段命名规则：
- 字段名必须以小写字母开头
- 只能包含小写字母、数字和下划线
- 示例：user_name, email_address, created_at

### 必填字段配置：
- 每个字段必须有 id、name、type、required 属性
- 字符串类型必须设置 length
- 日期类型必须设置 dateType
- 枚举类型需要 enumConfig
- 关联类型需要 relationConfig
- 媒体类型需要 mediaConfig
- API类型需要 apiConfig

### 系统字段建议：
- id: uuid类型，作为主键
- created_at: date类型，datetime格式，记录创建时间
- updated_at: date类型，datetime格式，记录更新时间

### 主键和索引规则：
- 每个表必须有主键，通常使用 id 字段（uuid类型）
- 根据业务需求设置合适的索引：
  - 唯一索引：用于唯一性约束（如邮箱、手机号）
  - 普通索引：用于查询优化（如状态、分类）
  - 复合索引：用于多字段查询优化

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
    "primaryKey": ["id"],
    "indexes": [
      {
        "name": "idx_field_name",
        "fields": ["field_name"],
        "type": "unique"
      },
      {
        "name": "idx_status",
        "fields": ["status"],
        "type": "index"
      }
    ]
  },
  "newEnums": [
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
  ]
}

注意：
- 字符串字段必须设置length属性
- 日期字段必须设置dateType属性
- 字段类型必须是上述11种类型之一
- 字段名必须符合命名规则

只返回 JSON 格式的数据，不要包含其他说明文字。`;

      const aiResponse = await getSchemaHelp(prompt);
      
      // 尝试解析 AI 返回的 JSON
      let parsedSchema;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedSchema = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('未找到有效的 JSON 数据');
        }
      } catch (parseError) {
        console.error('解析 AI 响应失败:', parseError);
        message.error('AI 返回的数据格式不正确，请重试');
        return;
      }

      // 验证生成的模型
      if (parsedSchema.name && parsedSchema.code && parsedSchema.fields && Array.isArray(parsedSchema.fields)) {
        // 为字段添加必要的属性
        const processedFields = parsedSchema.fields.map((field: any, index: number) => ({
          id: field.id || `field_${index}`,
          name: field.name,
          type: field.type,
          description: field.description || '',
          required: field.required || false,
          length: field.length,
          dateType: field.dateType,
          enumConfig: field.enumConfig,
          relationConfig: field.relationConfig,
          mediaConfig: field.mediaConfig,
          apiConfig: field.apiConfig
        }));

        const schema: GeneratedSchema = {
          name: parsedSchema.name,
          code: parsedSchema.code,
          description: parsedSchema.description || values.description,
          fields: processedFields,
          keyIndexes: parsedSchema.keyIndexes || {
            primaryKey: ['id'],
            indexes: []
          }
        };

        // 处理新枚举
        if (parsedSchema.newEnums && Array.isArray(parsedSchema.newEnums)) {
          setNewEnums(parsedSchema.newEnums);
        } else {
          setNewEnums([]);
        }

        setGeneratedSchema(schema);
        message.success('模型生成成功！');
      } else {
        message.error('AI 生成的模型格式不正确');
      }
    } catch (error) {
      console.error('生成模型失败:', error);
      message.error('生成模型失败，请检查网络连接或重试');
    } finally {
      setIsGenerating(false);
      setIsAILoading(false);
    }
  };

  // 确认创建
  const handleConfirm = async () => {
    if (!generatedSchema) return;
    
    setIsConfirming(true);
    try {
      // 先创建新枚举
      if (newEnums.length > 0) {
        message.info(`正在创建 ${newEnums.length} 个新枚举...`);
        for (const enumItem of newEnums) {
          try {
            await postEnums(enumItem);
            console.log(`枚举创建成功: ${enumItem.code}`);
          } catch (error: any) {
            console.error(`枚举创建失败: ${enumItem.code}`, error);
            // 如果枚举已存在，继续处理
            if (error?.response?.status === 409) {
              console.log(`枚举已存在: ${enumItem.code}`);
            } else {
              throw error;
            }
          }
        }
        message.success('新枚举创建完成！');
      }

      // 再创建数据模型
      await onSuccess({
        name: generatedSchema.name,
        code: generatedSchema.code,
        description: generatedSchema.description,
        fields: generatedSchema.fields,
        keyIndexes: generatedSchema.keyIndexes
      });
      message.success('数据模型创建成功！');
      handleCancel();
    } catch (error) {
      console.error('创建数据模型失败:', error);
      // 显示详细的错误信息
      const errorMessage = error instanceof Error ? error.message : '创建数据模型失败';
      message.error(`创建失败：${errorMessage}`);
      // 失败时不关闭面板，让用户可以重试或修改
    } finally {
      setIsConfirming(false);
    }
  };

  // 重新生成
  const handleRegenerate = () => {
    setGeneratedSchema(null);
    handleGenerate();
  };

  // 修改模型
  const handleModify = async () => {
    if (!modifyInput.trim() || !generatedSchema) return;
    
    setIsModifying(true);
    setIsAILoading(true);
    
    try {
      const prompt = `请根据以下要求修改现有的数据模型：

原始模型：
${JSON.stringify(generatedSchema, null, 2)}

修改要求：${modifyInput}

## 现有枚举列表
${existingEnums.map(enumItem => `- ${enumItem.code}: ${enumItem.name} (${enumItem.options?.map(opt => `${opt.value}:${opt.label}`).join(', ')})`).join('\n')}

请根据修改要求重新生成完整的数据模型，保持原有的字段类型和配置规则。

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
    "primaryKey": ["id"],
    "indexes": [
      {
        "name": "idx_field_name",
        "fields": ["field_name"],
        "type": "unique"
      }
    ]
  }
}

只返回 JSON 格式的数据，不要包含其他说明文字。`;

      const aiResponse = await getSchemaHelp(prompt);
      
      // 尝试解析 AI 返回的 JSON
      let parsedSchema;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedSchema = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('未找到有效的 JSON 数据');
        }
      } catch (parseError) {
        console.error('解析 AI 响应失败:', parseError);
        message.error('AI 返回的数据格式不正确，请重试');
        return;
      }

      // 验证生成的模型
      if (parsedSchema.name && parsedSchema.code && parsedSchema.fields && Array.isArray(parsedSchema.fields)) {
        // 为字段添加必要的属性
        const processedFields = parsedSchema.fields.map((field: any, index: number) => ({
          id: field.id || `field_${index}`,
          name: field.name,
          type: field.type,
          description: field.description || '',
          required: field.required || false,
          length: field.length,
          dateType: field.dateType,
          enumConfig: field.enumConfig,
          relationConfig: field.relationConfig,
          mediaConfig: field.mediaConfig,
          apiConfig: field.apiConfig
        }));

        const schema: GeneratedSchema = {
          name: parsedSchema.name,
          code: parsedSchema.code,
          description: parsedSchema.description || generatedSchema.description,
          fields: processedFields,
          keyIndexes: parsedSchema.keyIndexes || {
            primaryKey: ['id'],
            indexes: []
          }
        };

        // 处理新枚举
        if (parsedSchema.newEnums && Array.isArray(parsedSchema.newEnums)) {
          setNewEnums(parsedSchema.newEnums);
        } else {
          setNewEnums([]);
        }

        setGeneratedSchema(schema);
        setModifyInput('');
        setShowModifyDialog(false);
        message.success('模型修改成功！');
      } else {
        message.error('AI 生成的模型格式不正确');
      }
    } catch (error) {
      console.error('修改模型失败:', error);
      message.error('修改模型失败，请检查网络连接或重试');
    } finally {
      setIsModifying(false);
      setIsAILoading(false);
    }
  };

  // 取消
  const handleCancel = () => {
    form.resetFields();
    setGeneratedSchema(null);
    onCancel();
  };

  // 渲染字段列表
  const renderFields = (fields: Field[]) => {
    return fields.map((field, index) => (
      <Card 
        key={field.id || index} 
        size="small" 
        style={{ marginBottom: 8 }}
        bodyStyle={{ padding: '8px 12px' }}
      >
        <Space>
          <span style={{ fontWeight: 500, minWidth: 80 }}>{field.name}</span>
          <Tag color="blue">{field.type}</Tag>
          {field.required && <Tag color="cyan">必填</Tag>}
          {field.type === 'string' && field.length && (
            <Tag color="green">VARCHAR({field.length})</Tag>
          )}
          {field.description && (
            <span style={{ color: '#666', fontSize: '12px' }}>
              {field.description}
            </span>
          )}
        </Space>
      </Card>
    ));
  };

  return (
      <Modal
        title={
          <Space>
            <RobotOutlined style={{ color: '#1890ff' }} />
            <span>AI 智能新建模型</span>
          </Space>
        }
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={800}
        destroyOnClose
      >
      <div style={{ padding: '20px 0' }}>
        {!generatedSchema ? (
          // 第一步：输入需求
          <div>
            <Title level={4}>第一步：描述你的需求</Title>
            <Paragraph type="secondary">
              请描述你想要创建的数据模型，AI 将根据你的描述自动生成完整的模型结构。
            </Paragraph>
            
            <Form form={form} layout="vertical">
              <Form.Item
                name="description"
                label="业务描述"
                rules={[{ required: true, message: '请详细描述业务需求' }]}
              >
                <TextArea
                  rows={8}
                  placeholder="请详细描述你想要创建的数据模型，AI 将根据你的描述自动生成完整的模型结构。

例如：
- 存储用户的基本信息，包含姓名、邮箱、手机号、性别、生日等字段
- 需要支持用户注册、登录、个人信息修改等功能
- 邮箱和手机号需要唯一性约束
- 需要记录创建时间和更新时间

或者：
- 存储商品信息，包含商品名称、价格、库存、分类、图片等
- 需要支持商品上架下架、库存管理、分类管理等功能
- 价格需要精确到分，库存不能为负数
- 需要记录创建时间和更新时间"
                />
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Space>
                <Button
                  type="primary"
                  size="large"
                  icon={<RobotOutlined />}
                  loading={isGenerating}
                  onClick={handleGenerate}
                  style={{
                    background: 'radial-gradient(117.61% 84.5% at 147.46% 76.45%, rgba(82, 99, 255, 0.8) 0%, rgba(143, 65, 238, 0) 100%), linear-gradient(72deg, rgb(60, 115, 255) 18.03%, rgb(110, 65, 238) 75.58%, rgb(214, 65, 238) 104.34%)',
                    border: 'none',
                    height: 48,
                    padding: '0 32px'
                  }}
                >
                  {isGenerating ? 'AI 生成中...' : '开始生成模型'}
                </Button>
                {/* <Button
                  type="default"
                  size="large"
                  onClick={() => {
                    setIsAILoading(true);
                    setTimeout(() => {
                      setIsAILoading(false);
                    }, 300000);
                  }}
                >
                  测试 AILoading
                </Button> */}
              </Space>
            </div>
          </div>
        ) : (
          // 第二步：确认生成的模型
          <div>
            <Title level={4}>第二步：确认生成的模型</Title>
            <Paragraph type="secondary">
              AI 已根据你的需求生成了模型结构，请确认是否符合预期。
            </Paragraph>

            <Card title="模型信息" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <strong>模型名：</strong>
                  <span>{generatedSchema.code.split(':').pop()}</span>
                </div>
                <div>
                  <strong>代码：</strong>
                  <Tag color="blue">{generatedSchema.code}</Tag>
                </div>
                <div>
                  <strong>描述：</strong>
                  <span>{generatedSchema.name}</span>
                </div>
              </Space>
            </Card>

            <Card title={`字段列表 (${generatedSchema.fields.length} 个字段)`} style={{ marginBottom: 16 }}>
              {renderFields(generatedSchema.fields)}
            </Card>

            {/* 索引信息展示 */}
            {generatedSchema.keyIndexes && (
              <Card title="主键和索引配置" style={{ marginBottom: 16 }}>
                <div><strong>主键：</strong>{generatedSchema.keyIndexes.primaryKey?.join(', ') || '-'}</div>
                <div>
                  <strong>索引：</strong>
                  {generatedSchema.keyIndexes.indexes && generatedSchema.keyIndexes.indexes.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {generatedSchema.keyIndexes.indexes.map((idx, i) => (
                        <li key={i}>
                          {idx.type === 'unique' ? '唯一索引' : '普通索引'}
                          ：{idx.fields?.join(', ')}
                          {idx.name ? `（${idx.name}）` : ''}
                        </li>
                      ))}
                    </ul>
                  ) : '无'}
                </div>
              </Card>
            )}

            {/* 新枚举信息展示 */}
            {newEnums.length > 0 && (
              <Card title={`新枚举 (${newEnums.length} 个)`} style={{ marginBottom: 16 }}>
                {newEnums.map((enumItem, index) => (
                  <div key={index} style={{ marginBottom: 12 }}>
                    <div><strong>代码：</strong><Tag color="blue">{enumItem.code}</Tag></div>
                    <div><strong>名称：</strong>{enumItem.name}</div>
                    <div><strong>描述：</strong>{enumItem.description || '-'}</div>
                    <div>
                      <strong>选项：</strong>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {enumItem.options?.map((option, optIndex) => (
                          <li key={optIndex}>
                            {option.value}: {option.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </Card>
            )}

            {/* 对话窗口：用户可输入修改要求 */}
            <Card title="对模型有进一步要求？" style={{ marginBottom: 16 }}>
              <Input.TextArea
                value={modifyInput}
                onChange={e => setModifyInput(e.target.value)}
                rows={3}
                placeholder="如：增加一个唯一索引，添加手机号字段，主键改为自增长ID等"
                disabled={isModifying}
              />
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <Button
                  type="primary"
                  loading={isModifying}
                  disabled={!modifyInput.trim()}
                  onClick={handleModify}
                >
                  提交修改要求并重新生成
                </Button>
              </div>
            </Card>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Space size="large">
                <Button
                  icon={<EditOutlined />}
                  onClick={handleRegenerate}
                  loading={isGenerating}
                >
                  重新生成
                </Button>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleConfirm}
                  loading={isConfirming}
                  style={{
                    background: 'radial-gradient(117.61% 84.5% at 147.46% 76.45%, rgba(82, 99, 255, 0.8) 0%, rgba(143, 65, 238, 0) 100%), linear-gradient(72deg, rgb(60, 115, 255) 18.03%, rgb(110, 65, 238) 75.58%, rgb(214, 65, 238) 104.34%)',
                    border: 'none',
                    height: 40,
                    padding: '0 24px'
                  }}
                >
                  确认创建
                </Button>
              </Space>
            </div>
          </div>
        )}
      </div>
      <AILoading visible={isAILoading} text="AI 正在生成模型..." />
    </Modal>
  );
};

export default AICreateSchema; 