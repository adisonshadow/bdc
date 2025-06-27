import React, { useEffect, useState } from 'react';
import { Card, Button, Space, Typography } from 'antd';
import { checkAuthStatus, redirectToLogin, logout } from '../auth';

const { Title, Text } = Typography;

const TestAuth: React.FC = () => {
  const [authState, setAuthState] = useState<any>(null);

  useEffect(() => {
    const state = checkAuthStatus();
    setAuthState(state);
    console.log('认证状态:', state);
  }, []);

  const handleLogin = () => {
    redirectToLogin();
  };

  const handleLogout = () => {
    logout();
  };

  const handleCheckAuth = () => {
    const state = checkAuthStatus();
    setAuthState(state);
    console.log('重新检查认证状态:', state);
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title="认证测试页面">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>当前认证状态</Title>
            <pre>{JSON.stringify(authState, null, 2)}</pre>
          </div>
          
          <Space>
            <Button type="primary" onClick={handleLogin}>
              跳转到登录页
            </Button>
            <Button onClick={handleCheckAuth}>
              重新检查认证状态
            </Button>
            <Button danger onClick={handleLogout}>
              登出
            </Button>
          </Space>
          
          <div>
            <Text type="secondary">
              如果未登录，应该自动跳转到: http://localhost:8002/auth/login?app=7913b18c-e3f2-4d40-8b6b-b0239c98fef6
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default TestAuth;
