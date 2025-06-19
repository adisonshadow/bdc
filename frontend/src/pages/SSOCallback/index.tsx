import React, { useEffect, useState } from 'react';
import { Card, Spin, Alert, Button, Typography, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';

const { Title, Text } = Typography;

interface ErrorResponse {
  success: false;
  message: string;
  details: string;
  code?: string;
}

interface SuccessResponse {
  success: true;
  token: string;
  user: {
    user_id: string;
    username: string;
    name: string;
    email: string;
    phone?: string;
    gender?: string;
    status: string;
    department_id?: string;
  };
}

const SSOCallback: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [success, setSuccess] = useState<SuccessResponse | null>(null);

  useEffect(() => {
    handleSSOCallback();
  }, []);

  const handleSSOCallback = async () => {
    try {
      setLoading(true);
      
      // 获取 URL 参数
      const urlParams = new URLSearchParams(window.location.search);
      const params = Object.fromEntries(urlParams.entries());
      
      // 发送 POST 请求到后端
      const response = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params).toString(),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data);
        // 保存 token 到 localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // 延迟重定向，让用户看到成功信息
        setTimeout(() => {
          history.push('/');
        }, 2000);
      } else {
        setError(data);
      }
    } catch (err) {
      console.error('SSO 回调处理错误:', err);
      setError({
        success: false,
        message: '网络错误',
        details: '无法连接到服务器，请检查网络连接',
        code: 'NETWORK_ERROR'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    handleSSOCallback();
  };

  const handleGoHome = () => {
    history.push('/');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#f5f5f5'
      }}>
        <Card style={{ width: 400, textAlign: 'center' }}>
          <Spin 
            indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} 
            size="large"
          />
          <Title level={4} style={{ marginTop: 16, marginBottom: 8 }}>
            正在处理认证信息
          </Title>
          <Text type="secondary">
            请稍候，正在验证您的身份信息...
          </Text>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#f5f5f5'
      }}>
        <Card style={{ width: 500 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <CloseCircleOutlined 
              style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} 
            />
            <Title level={3} style={{ color: '#ff4d4f', marginBottom: 8 }}>
              {error.message}
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {error.details}
            </Text>
          </div>
          
          <Alert
            message="错误详情"
            description={
              <div>
                <Text strong>错误代码：</Text> {error.code || 'UNKNOWN'}<br />
                <Text strong>错误信息：</Text> {error.message}<br />
                <Text strong>详细信息：</Text> {error.details}
              </div>
            }
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          <Space style={{ width: '100%', justifyContent: 'center' }}>
            <Button type="primary" onClick={handleRetry}>
              重试
            </Button>
            <Button onClick={handleGoHome}>
              返回首页
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#f5f5f5'
      }}>
        <Card style={{ width: 400, textAlign: 'center' }}>
          <CheckCircleOutlined 
            style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} 
          />
          <Title level={3} style={{ color: '#52c41a', marginBottom: 8 }}>
            认证成功
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            欢迎回来，{success.user.name}！
          </Text>
          
          <Alert
            message="用户信息"
            description={
              <div style={{ textAlign: 'left' }}>
                <Text strong>用户名：</Text> {success.user.username}<br />
                <Text strong>姓名：</Text> {success.user.name}<br />
                <Text strong>邮箱：</Text> {success.user.email}<br />
                {success.user.phone && (
                  <>
                    <Text strong>手机：</Text> {success.user.phone}<br />
                  </>
                )}
                <Text strong>状态：</Text> {success.user.status}
              </div>
            }
            type="success"
            showIcon
            style={{ marginTop: 16, marginBottom: 16 }}
          />
          
          <Text type="secondary" style={{ fontSize: 12 }}>
            正在跳转到首页...
          </Text>
        </Card>
      </div>
    );
  }

  return null;
};

export default SSOCallback; 