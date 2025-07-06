import React from 'react';
import { Card, Space, Tag, Typography, Button, Input } from 'antd';
import { CheckOutlined, EditOutlined } from '@ant-design/icons';
import { Sender } from '@ant-design/x';
import type { Field } from '@/components/SchemaValidator/types';

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

interface SchemaData {
  name: string;
  code: string;
  description: string;
  fields: Field[];
  keyIndexes?: {
    primaryKey?: string[];
    indexes?: {
      name?: string;
      fields?: string[];
      type?: "unique" | "normal" | "fulltext" | "spatial";
    }[];
  };
  optimizationNotes?: string;
  newEnums?: any[];
}

interface SchemaConfirmationProps {
  schema: SchemaData;
  stepTitle?: string;
  stepDescription?: string;
  modifyInput?: string;
  onModifyInputChange?: (value: string) => void;
  onModify?: () => void;
  onRegenerate?: () => void;
  onConfirm?: () => void;
  isModifying?: boolean;
  isRegenerating?: boolean;
  isConfirming?: boolean;
  modifyButtonText?: string;
  regenerateButtonText?: string;
  confirmButtonText?: string;
  showOptimizationNotes?: boolean;
}

const SchemaConfirmation: React.FC<SchemaConfirmationProps> = ({
  schema,
  stepTitle = "第二步：确认生成的模型",
  stepDescription = "AI 已根据你的需求生成了模型结构，请确认是否符合预期。",
  modifyInput = "",
  onModifyInputChange,
  onModify,
  onRegenerate,
  onConfirm,
  isModifying = false,
  isRegenerating = false,
  isConfirming = false,
  modifyButtonText = "提交修改要求并重新生成",
  regenerateButtonText = "重新生成",
  confirmButtonText = "确认创建",
  showOptimizationNotes = false
}) => {
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
    <div style={{ padding: '20px 0' }}>
      <Title level={4}>{stepTitle}</Title>
      <Paragraph type="secondary">
        {stepDescription}
      </Paragraph>

      <Card title="模型信息" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <strong>模型名：</strong>
            <span>{schema.code.split(':').pop()}</span>
          </div>
          <div>
            <strong>代码：</strong>
            <Tag color="blue">{schema.code}</Tag>
          </div>
          <div>
            <strong>描述：</strong>
            <span>{schema.name}</span>
          </div>
          {showOptimizationNotes && schema.optimizationNotes && (
            <div>
              <strong>优化说明：</strong>
              <span style={{ color: '#666' }}>{schema.optimizationNotes}</span>
            </div>
          )}
        </Space>
      </Card>

      <Card title={`字段列表 (${schema.fields.length} 个字段)`} style={{ marginBottom: 16 }}>
        {renderFields(schema.fields)}
      </Card>

      {/* 新枚举信息展示 */}
      {schema.newEnums && schema.newEnums.length > 0 && (
        <Card title={`新枚举 (${schema.newEnums.length} 个)`} style={{ marginBottom: 16 }}>
          {schema.newEnums.map((enumItem, index) => (
            <div key={index} style={{ marginBottom: 12 }}>
              <div><strong>代码：</strong><Tag color="blue">{enumItem.code}</Tag></div>
              <div><strong>名称：</strong>{enumItem.name}</div>
              <div><strong>描述：</strong>{enumItem.description || '-'}</div>
              <div>
                <strong>选项：</strong>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {enumItem.options?.map((option: any, optIndex: number) => (
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

      {/* 索引信息展示 */}
      {schema.keyIndexes && (
        <Card title="主键和索引配置" style={{ marginBottom: 16 }}>
          <div>
            <strong>主键：</strong>
            {Array.isArray(schema.keyIndexes.primaryKey) 
              ? schema.keyIndexes.primaryKey.join(', ') 
              : schema.keyIndexes.primaryKey || '-'}
          </div>
          <div>
            <strong>索引：</strong>
            {schema.keyIndexes.indexes && Array.isArray(schema.keyIndexes.indexes) && schema.keyIndexes.indexes.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {schema.keyIndexes.indexes.map((idx, i) => (
                  <li key={i}>
                    {idx.type === 'unique' ? '唯一索引' : 
                     idx.type === 'fulltext' ? '全文索引' :
                     idx.type === 'spatial' ? '空间索引' : '普通索引'}
                    ：{Array.isArray(idx.fields) ? idx.fields.join(', ') : idx.fields || ''}
                    {idx.name ? `（${idx.name}）` : ''}
                  </li>
                ))}
              </ul>
            ) : '无'}
          </div>
        </Card>
      )}

      {/* 修改要求输入 */}
      {onModifyInputChange && onModify && (
        <Card title="对模型有进一步要求？" style={{ marginBottom: 16 }}>
          <Sender
            value={modifyInput}
            onChange={value => onModifyInputChange(value)}
            autoSize={{ minRows: 3, maxRows: 6 }}
            placeholder="如：增加一个唯一索引，添加手机号字段，主键改为自增长ID等"
            disabled={isModifying}
          />
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <Button
              type="primary"
              loading={isModifying}
              disabled={!modifyInput.trim()}
              onClick={onModify}
            >
              {modifyButtonText}
            </Button>
          </div>
        </Card>
      )}

      {/* 操作按钮 */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Space size="large">
          {onRegenerate && (
            <Button
              icon={<EditOutlined />}
              onClick={onRegenerate}
              loading={isRegenerating}
            >
              {regenerateButtonText}
            </Button>
          )}
          {onConfirm && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={onConfirm}
              loading={isConfirming}
              style={{
                background: 'radial-gradient(117.61% 84.5% at 147.46% 76.45%, rgba(82, 99, 255, 0.8) 0%, rgba(143, 65, 238, 0) 100%), linear-gradient(72deg, rgb(60, 115, 255) 18.03%, rgb(110, 65, 238) 75.58%, rgb(214, 65, 238) 104.34%)',
                border: 'none',
                height: 40,
                padding: '0 24px'
              }}
            >
              {confirmButtonText}
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
};

export default SchemaConfirmation; 