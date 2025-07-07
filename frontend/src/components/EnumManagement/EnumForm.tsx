import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  message,
  Switch,
  InputNumber,
  Divider
} from 'antd';
import { PlusOutlined, DeleteOutlined, MinusCircleOutlined, HolderOutlined } from '@ant-design/icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { postEnums, putEnumsId } from '@/services/BDC/api/enumManagement';

const { TextArea } = Input;

// 可拖拽的枚举选项组件
const SortableOptionItem: React.FC<{
  id: string;
  name: any;
  restField: any;
  remove: (name: any) => void;
}> = ({ id, name, restField, remove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
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
    <div ref={setNodeRef} style={style} {...attributes}>
      <Space
        style={{
          marginBottom: 8,
          padding: 8,
          backgroundColor: '#f5f5f511',
          borderRadius: 6,
          width: '100%',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Button
          type="text"
          icon={<HolderOutlined />}
          style={{ cursor: 'move', padding: '4px 8px' }}
          size="small"
          ref={setActivatorNodeRef}
          {...listeners}
        />
        <Form.Item
          {...restField}
          name={[name, 'value']}
          className='mb-0'
          rules={[
            { required: true, message: '请输入选项值' },
            { pattern: /^[a-z0-9_]+$/, message: '值只能包含小写字母、数字和下划线' },
          ]}
        >
          <Input placeholder="值" style={{ width: 100 }} />
        </Form.Item>
        <Form.Item
          {...restField}
          name={[name, 'label']}
          className='mb-0'
          rules={[{ required: true, message: '请输入选项标签' }]}
        >
          <Input placeholder="标签" style={{ width: 120 }} />
        </Form.Item>
        <Form.Item
          {...restField}
          name={[name, 'description']}
          className='mb-0'
        >
          <Input placeholder="描述" style={{ width: 150 }} />
        </Form.Item>
        {/* <Form.Item
          {...restField}
          name={[name, 'order']}
          className='mb-0'
        >
          <InputNumber placeholder="排序" style={{ width: 80 }} />
        </Form.Item> */}
        <MinusCircleOutlined 
          className='ms-4' 
          onClick={() => remove(name)}
          style={{ cursor: 'pointer' }}
        />
      </Space>
    </div>
  );
};

interface EnumFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingEnum?: API.Enum | null;
}

const EnumForm: React.FC<EnumFormProps> = ({
  visible,
  onClose,
  onSuccess,
  editingEnum
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);


  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const options = form.getFieldValue('options') || [];
      const oldIndex = options.findIndex((_: any, index: number) => `option-${index}` === active.id);
      const newIndex = options.findIndex((_: any, index: number) => `option-${index}` === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOptions = arrayMove(options, oldIndex, newIndex);
        form.setFieldValue('options', newOptions);
      }
    }
  };

  // 当编辑枚举或模态框打开时，设置表单初始值
  useEffect(() => {
    if (visible) {
      if (editingEnum) {
        // 编辑模式：设置现有数据
        form.setFieldsValue({
          code: editingEnum.code,
          name: editingEnum.name,
          description: editingEnum.description,
          isActive: editingEnum.isActive,
          options: editingEnum.options || []
        });
      } else {
        // 新增模式：重置表单
        form.resetFields();
        form.setFieldsValue({
          isActive: true,
          options: []
        });
      }
    }
  }, [visible, editingEnum, form]);

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const enumData: API.Enum = {
        code: values.code,
        name: values.name,
        description: values.description,
        options: values.options,
        isActive: values.isActive !== false
      };

      if (editingEnum?.id) {
        // 编辑枚举
        await putEnumsId({ id: editingEnum.id }, enumData);
        message.success('枚举更新成功');
      } else {
        // 添加枚举
        await postEnums(enumData);
        message.success('枚举创建成功');
      }

      onClose();
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      console.error('保存枚举失败:', error);
      const errorMessage = error.response?.data?.message || '保存枚举失败';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 处理模态框关闭
  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={editingEnum ? '编辑枚举' : '添加枚举'}
      open={visible}
      onCancel={handleClose}
      onOk={() => form.submit()}
      width={800}
      destroyOnClose
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="code"
          label="枚举代码"
          rules={[
            { required: true, message: '请输入枚举代码' },
            { pattern: /^[a-zA-Z][a-zA-Z0-9_:]*$/, message: '代码格式不正确' }
          ]}
        >
          <Input placeholder="如：system:gender" />
        </Form.Item>

        <Form.Item
          name="name"
          label="枚举名称"
          rules={[
            { required: true, message: '请输入枚举名称' },
            { pattern: /^[a-z][a-z0-9_]*$/, message: '名称格式不正确' }
          ]}
        >
          <Input placeholder="如：gender" />
        </Form.Item>

        <Form.Item
          name="description"
          label="枚举描述"
        >
          <Input placeholder="请输入枚举描述" />
        </Form.Item>

        <Form.Item
          name="isActive"
          label="是否启用"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.List name="options">
          {(fields, { add, remove }) => (
            <>
              <Divider>枚举选项</Divider>
              <div>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  style={{ marginBottom: 16 }}
                >
                  添加选项
                </Button>
              </div>
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <SortableContext
                  items={fields.map((_, index) => `option-${index}`)}
                  strategy={verticalListSortingStrategy}
                >
                  {fields.map(({ key, name, ...restField }, index) => (
                    <SortableOptionItem
                      key={key}
                      id={`option-${index}`}
                      name={name}
                      restField={restField}
                      remove={remove}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

export default EnumForm; 