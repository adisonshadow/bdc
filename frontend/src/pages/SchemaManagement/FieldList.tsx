import React, { useState } from 'react';
import { List, Button, Space, Tag, Popconfirm, Select, notification } from 'antd';
import { EditOutlined, DeleteOutlined, HolderOutlined } from '@ant-design/icons';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


const { Option } = Select;

type Field = API.UuidField | API.AutoIncrementField | API.StringField | API.TextField | API.NumberField | API.BooleanField | API.DateField | API.EnumField | API.RelationField | API.MediaField | API.ApiField;

// 扩展 RelationField 类型
interface ExtendedRelationField extends API.RelationField {
  relationType?: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
}

interface FieldListProps {
  fields: Field[];
  onFieldEdit: (field: Field) => void;
  onFieldDelete: (index: number) => void;
  onFieldsReorder: (fields: Field[]) => void;
  onIndexTypeChange: (fieldName: string, indexType: string) => void;
  getFieldIndexType: (fieldName: string) => string;
  getRelationTypeText: (field: ExtendedRelationField) => string;
  getTargetSchemaDescription: (code: string | undefined) => string;
  getEnumDescription: (enumCode: string | undefined) => string;
}

// 可拖拽的字段项组件
const SortableFieldItem: React.FC<{
  id: string;
  field: Field;
  index: number;
  onEdit: (field: Field) => void;
  onDelete: (index: number) => void;
  onIndexTypeChange: (fieldName: string, indexType: string) => void;
  getFieldIndexType: (fieldName: string) => string;
  getRelationTypeText: (field: ExtendedRelationField) => string;
  getTargetSchemaDescription: (code: string | undefined) => string;
  getEnumDescription: (enumCode: string | undefined) => string;
}> = ({ 
  id, 
  field, 
  index, 
  onEdit, 
  onDelete, 
  onIndexTypeChange, 
  getFieldIndexType, 
  getRelationTypeText, 
  getTargetSchemaDescription, 
  getEnumDescription 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  };

  return (
    <div ref={setNodeRef} style={style}>
      <List.Item className="px-0">
        <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
          <div style={{ flex: 1 }}>
            <List.Item.Meta
              title={
                <Space>
                  <span>{field.name}</span>
                  {field.description && <span>({field.description})</span>}
                  <Tag color="blue">{field.type}</Tag>
                </Space>
              }
              description={
                <div style={{ marginTop: '4px' }}>
                  {/* 必填 */}
                  {field.required && <Tag color="cyan" bordered={false}>必填</Tag>}
                  {/* 索引状态 */}
                  {getFieldIndexType(field.name) === 'primary' && (
                    <Tag color="red" bordered={false}>主键</Tag>
                  )}
                  {getFieldIndexType(field.name) === 'unique' && (
                    <Tag color="orange" bordered={false}>唯一索引</Tag>
                  )}
                  {getFieldIndexType(field.name) === 'normal' && (
                    <Tag color="green" bordered={false}>普通索引</Tag>
                  )}
                  {getFieldIndexType(field.name) === 'fulltext' && (
                    <Tag color="purple" bordered={false}>全文索引</Tag>
                  )}
                  {getFieldIndexType(field.name) === 'spatial' && (
                    <Tag color="blue" bordered={false}>空间索引</Tag>
                  )}
                  {/* 长度 */}
                  {field.type === 'string' && (field as API.StringField).length && (
                    <Tag color="cyan" bordered={false}>
                      VARCHAR({(field as API.StringField).length})
                    </Tag>
                  )}
                  {/* 长文本 */}
                  {field.type === 'text' && (
                    <Tag color="cyan" bordered={false}>
                      TEXT
                    </Tag>
                  )}
                  {/* 日期 */}
                  {field.type === 'date' && (field as API.DateField).dateConfig && (
                    <Tag color="cyan" bordered={false}>
                      {(field as API.DateField).dateConfig?.dateType === 'year' ? '年' :
                       (field as API.DateField).dateConfig?.dateType === 'year-month' ? '年月' :
                       (field as API.DateField).dateConfig?.dateType === 'date' ? '年月日' :
                       (field as API.DateField).dateConfig?.dateType === 'datetime' ? '年月日时间' : '日期'}
                    </Tag>
                  )}
                  {/* 枚举 */}
                  {field.type === 'enum' && (field as API.EnumField).enumConfig && (
                    <>
                      <Tag color="cyan" bordered={false}>
                        枚举: {getEnumDescription((field as API.EnumField).enumConfig?.targetEnumCode)}
                      </Tag>
                      {(field as API.EnumField).enumConfig?.multiple && (
                        <Tag color="purple" bordered={false}>允许多选</Tag>
                      )}
                    </>
                  )}
                  {/* 关联 */}
                  {field.type === 'relation' && (field as API.RelationField).relationConfig && (
                    <>
                      <Tag color="cyan" bordered={false}>
                        {getRelationTypeText(field as ExtendedRelationField)}
                      </Tag>
                      <Tag color="cyan" bordered={false}>
                        关联: {getTargetSchemaDescription((field as API.RelationField).relationConfig?.targetSchemaCode)}
                      </Tag>
                    </>
                  )}
                  {/* 媒体 */}
                  {field.type === 'media' && (field as API.MediaField).mediaConfig && (
                    <Tag color="cyan" bordered={false}>媒体类型: {(field as API.MediaField).mediaConfig?.mediaType}</Tag>
                  )}
                  {/* API */}
                  {field.type === 'api' && (field as API.ApiField).apiConfig && (
                    <Tag color="cyan" bordered={false}>API: {(field as API.ApiField).apiConfig?.endpoint}</Tag>
                  )}
                  {/* 数字类型 */}
                  {field.type === 'number' && (field as API.NumberField).numberConfig && (
                    <>
                      <Tag color="cyan" bordered={false}>
                        {(field as API.NumberField).numberConfig?.numberType === 'integer' ? '整数' :
                         (field as API.NumberField).numberConfig?.numberType === 'float' ? '浮点数' :
                         (field as API.NumberField).numberConfig?.numberType === 'decimal' ? '精确小数' : '数字'}
                      </Tag>
                      {(field as API.NumberField).numberConfig?.precision && (field as API.NumberField).numberConfig?.scale && (
                        <Tag color="cyan" bordered={false}>
                          精度: {(field as API.NumberField).numberConfig?.precision},{(field as API.NumberField).numberConfig?.scale}
                        </Tag>
                      )}
                    </>
                  )}
                </div>
              }
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
            <Select
              size="small"
              style={{ width: 100 }}
              placeholder="索引类型"
              value={getFieldIndexType(field.name)}
              onChange={(value) => onIndexTypeChange(field.name, value)}
              allowClear
            >
              <Option value="primary">主键</Option>
              <Option value="unique">唯一索引</Option>
              <Option value="normal">普通索引</Option>
              <Option value="fulltext">全文索引</Option>
              <Option value="spatial">空间索引</Option>
            </Select>
            <Button
              type="link"
              icon={<EditOutlined />}
              shape='circle'
              onClick={() => onEdit(field)}
            />
            <Popconfirm
              title="删除字段"
              description={`确定要删除字段 "${field.name}" 吗？此操作不可恢复。`}
              onConfirm={() => onDelete(index)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                shape='circle'
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
            <Button
              type="text"
              size="small"
              icon={<HolderOutlined />}
              style={{ cursor: 'move', padding: 0, height: 'auto' }}
              {...attributes}
              {...listeners}
            />
          </div>
        </div>
      </List.Item>
    </div>
  );
};

const FieldList: React.FC<FieldListProps> = ({
  fields,
  onFieldEdit,
  onFieldDelete,
  onFieldsReorder,
  onIndexTypeChange,
  getFieldIndexType,
  getRelationTypeText,
  getTargetSchemaDescription,
  getEnumDescription,
}) => {
  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex((_, index) => `field-${index}` === active.id);
      const newIndex = fields.findIndex((_, index) => `field-${index}` === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newFields = arrayMove(fields, oldIndex, newIndex);
        onFieldsReorder(newFields);
      }
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={fields.map((_, index) => `field-${index}`)}
          strategy={verticalListSortingStrategy}
        >
          <List
            dataSource={fields}
            size="small"
            renderItem={(field: Field, index: number) => (
              <SortableFieldItem
                key={field.id || index}
                id={`field-${index}`}
                field={field}
                index={index}
                onEdit={onFieldEdit}
                onDelete={onFieldDelete}
                onIndexTypeChange={onIndexTypeChange}
                getFieldIndexType={getFieldIndexType}
                getRelationTypeText={getRelationTypeText}
                getTargetSchemaDescription={getTargetSchemaDescription}
                getEnumDescription={getEnumDescription}
              />
            )}
          />
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default FieldList; 