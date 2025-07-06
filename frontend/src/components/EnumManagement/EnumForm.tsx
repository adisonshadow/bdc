import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  message,
  Switch,
  InputNumber
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { postEnums, putEnumsId } from '@/services/BDC/api/enumManagement';

const { TextArea } = Input;

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
        initialValues={{
          isActive: true,
          options: []
        }}
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
          <TextArea rows={3} placeholder="请输入枚举描述" />
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
              <Form.Item label="枚举选项">
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  style={{ marginBottom: 16 }}
                >
                  添加选项
                </Button>
                {fields.map(({ key, name, ...restField }) => (
                  <div
                    key={key}
                    style={{
                      marginBottom: 8,
                      padding: 8,
                      border: '1px solid #d9d9d9',
                      borderRadius: 6
                    }}
                  >
                    <Space>
                      <Form.Item
                        {...restField}
                        name={[name, 'value']}
                        rules={[{ required: true, message: '请输入选项值' }]}
                      >
                        <Input placeholder="值" style={{ width: 100 }} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'label']}
                        rules={[{ required: true, message: '请输入选项标签' }]}
                      >
                        <Input placeholder="标签" style={{ width: 120 }} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'description']}
                      >
                        <Input placeholder="描述" style={{ width: 150 }} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'order']}
                      >
                        <InputNumber placeholder="排序" style={{ width: 80 }} />
                      </Form.Item>
                      <Button
                        type="link"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                      >
                        删除
                      </Button>
                    </Space>
                  </div>
                ))}
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

export default EnumForm; 