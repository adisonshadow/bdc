import React from 'react';
import { Card, Button, Form, Input, Space, Typography } from 'antd';

const { Title, Text } = Typography;

const SSOTest: React.FC = () => {
  const [form] = Form.useForm();

  const handleTestSSO = (values: any) => {
    // 构建测试参数
    const params = new URLSearchParams();
    
    // 必填参数
    params.append('idp', 'IAM');
    params.append('timestamp', Date.now().toString());
    params.append('nonce', Math.random().toString(36).substring(7));
    params.append('access_token', 'test_access_token_' + Date.now());
    params.append('token_type', 'Bearer');
    params.append('expires_in', '3600');
    params.append('client_id', 'test_client_id');
    params.append('client_signature', 'test_signature');
    
    // 用户信息
    const userInfo = {
      user_id: values.user_id || 'test_user_123',
      username: values.username || 'testuser',
      name: values.name || '测试用户',
      email: values.email || 'test@example.com',
      phone: values.phone || '13800138000',
      gender: values.gender || 'MALE',
      status: values.status || 'ACTIVE',
      department_id: values.department_id || 'dept_123'
    };
    
    params.append('user_info', JSON.stringify(userInfo));
    
    // 重定向到 SSO 回调页面
    window.location.href = `/sso-callback?${params.toString()}`;
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title="SSO 回调测试" style={{ maxWidth: 600, margin: '0 auto' }}>
        <Title level={4}>测试 SSO 回调功能</Title>
        <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
          这个页面用于测试 SSO 回调功能。填写用户信息后点击测试按钮，将模拟 SSO 回调流程。
        </Text>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleTestSSO}
          initialValues={{
            user_id: 'test_user_123',
            username: 'testuser',
            name: '测试用户',
            email: 'test@example.com',
            phone: '13800138000',
            gender: 'MALE',
            status: 'ACTIVE',
            department_id: 'dept_123'
          }}
        >
          <Form.Item label="用户ID" name="user_id">
            <Input placeholder="请输入用户ID" />
          </Form.Item>
          
          <Form.Item label="用户名" name="username">
            <Input placeholder="请输入用户名" />
          </Form.Item>
          
          <Form.Item label="姓名" name="name">
            <Input placeholder="请输入姓名" />
          </Form.Item>
          
          <Form.Item label="邮箱" name="email">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          
          <Form.Item label="手机号" name="phone">
            <Input placeholder="请输入手机号" />
          </Form.Item>
          
          <Form.Item label="性别" name="gender">
            <Input placeholder="MALE/FEMALE/OTHER" />
          </Form.Item>
          
          <Form.Item label="状态" name="status">
            <Input placeholder="ACTIVE/DISABLED/LOCKED/ARCHIVED" />
          </Form.Item>
          
          <Form.Item label="部门ID" name="department_id">
            <Input placeholder="请输入部门ID" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                测试 SSO 回调
              </Button>
              <Button onClick={() => form.resetFields()}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
        
        <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
          <Text strong>说明：</Text>
          <ul style={{ marginTop: 8 }}>
            <li>点击"测试 SSO 回调"按钮将跳转到 SSO 回调页面</li>
            <li>回调页面会自动处理认证信息并显示结果</li>
            <li>认证成功后会跳转到首页</li>
            <li>认证失败会显示错误信息并提供重试选项</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default SSOTest; 