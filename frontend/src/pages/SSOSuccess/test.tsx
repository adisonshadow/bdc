import React from 'react';
import { Card, Button, Form, Input, Space, Typography } from 'antd';

const { Title, Text } = Typography;

const SSOSuccessTest: React.FC = () => {
  const [form] = Form.useForm();

  const handleTestSSOSuccess = (values: any) => {
    // 构建模拟的认证成功数据
    const authData = {
      success: true,
      token: 'test_jwt_token_' + Date.now(),
      user: {
        user_id: values.user_id || 'test_user_123',
        username: values.username || 'testuser',
        name: values.name || '测试用户',
        email: values.email || 'test@example.com',
        phone: values.phone || '13800138000',
        gender: values.gender || 'MALE',
        status: values.status || 'ACTIVE',
        department_id: values.department_id || 'dept_123'
      }
    };
    
    // 编码数据并构建URL
    const encodedData = encodeURIComponent(JSON.stringify(authData));
    const testUrl = `/sso-success?data=${encodedData}`;
    
    console.log('Test URL:', testUrl);
    console.log('Auth data:', authData);
    
    // 跳转到 SSO 成功页面
    window.location.href = testUrl;
  };

  const handleTestError = () => {
    // 测试错误情况
    const errorData = {
      success: false,
      message: '测试错误',
      details: '这是一个测试错误，用于验证错误处理功能',
      code: 'TEST_ERROR'
    };
    
    const encodedData = encodeURIComponent(JSON.stringify(errorData));
    const testUrl = `/sso-success?data=${encodedData}`;
    
    console.log('Test error URL:', testUrl);
    console.log('Error data:', errorData);
    
    window.location.href = testUrl;
  };

  const handleTestNoData = () => {
    // 测试没有数据的情况
    window.location.href = '/sso-success';
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title="SSO 成功页面测试" style={{ maxWidth: 600, margin: '0 auto' }}>
        <Title level={4}>测试 SSO 成功页面功能</Title>
        <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
          这个页面用于测试 SSO 成功页面的功能。填写用户信息后点击测试按钮，将模拟 SSO 成功流程。
        </Text>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleTestSSOSuccess}
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
                测试成功场景
              </Button>
              <Button danger onClick={handleTestError}>
                测试错误场景
              </Button>
              <Button onClick={handleTestNoData}>
                测试无数据场景
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
            <li><Text strong>测试成功场景：</Text>模拟认证成功，显示用户信息并跳转到首页</li>
            <li><Text strong>测试错误场景：</Text>模拟认证失败，显示错误信息</li>
            <li><Text strong>测试无数据场景：</Text>模拟没有接收到认证数据的情况</li>
            <li>所有测试都会在控制台输出详细信息</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default SSOSuccessTest; 