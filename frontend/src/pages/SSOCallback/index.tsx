import React, { useEffect, useState } from 'react';
import { Card, Spin, Alert, Button, Typography, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { saveAuthInfo, User } from '../../auth';

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
  user: User;
}

const SSOCallback: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [success, setSuccess] = useState<SuccessResponse | null>(null);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    // 检查是否有URL参数数据
    const checkForUrlData = () => {
      // 从URL参数读取数据
      const urlParams = new URLSearchParams(window.location.search);
      const params = Object.fromEntries(urlParams.entries());
      
      console.log('URL params:', params);
      
      if (Object.keys(params).length > 0) {
        // 解析user_info JSON字符串
        let userInfo = null;
        if (params.user_info) {
          try {
            userInfo = JSON.parse(decodeURIComponent(params.user_info));
            console.log('Parsed user_info:', userInfo);
          } catch (err) {
            console.error('Failed to parse user_info:', err);
          }
        }
        
        // 构建发送到后端的数据
        const data = {
          idp: params.idp,
          access_token: params.access_token,
          refresh_token: params.refresh_token,
          token_type: params.token_type,
          expires_in: params.expires_in,
          state: params.state,
          user_info: userInfo
        };
        
        console.log('Processed data:', data);
        setFormData(data);
        handleSSOCallback(data);
      } else {
        // 没有数据，显示错误
        setError({
          success: false,
          message: '未找到认证数据',
          details: 'SSO回调页面未接收到任何认证信息。请检查SSO服务器是否正确传递参数。',
          code: 'NO_DATA'
        });
        setLoading(false);
      }
    };

    // 延迟检查，确保页面完全加载
    setTimeout(checkForUrlData, 100);
  }, []);

  const handleSSOCallback = async (data?: any) => {
    try {
      setLoading(true);
      
      // 使用传入的数据或状态中的数据
      const params = data || formData;
      
      if (!params) {
        throw new Error('没有认证数据');
      }
      
      console.log('Sending data to backend:', params);
      
      // 发送 POST 请求到后端
      const response = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const responseData = await response.json();
      console.log('Backend response:', responseData);

      if (responseData.success) {
        setSuccess(responseData);
        // 使用认证模块保存用户信息
        saveAuthInfo(responseData.token, responseData.user);
        
        // 延迟重定向，让用户看到成功信息
        setTimeout(() => {
          history.push('/');
        }, 2000);
      } else {
        setError(responseData);
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
          {formData && (
            <div style={{ marginTop: 16, textAlign: 'left' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                接收到的数据: {JSON.stringify(formData, null, 2)}
              </Text>
            </div>
          )}
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

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f5f5f5'
    }}>
      <Card style={{ width: 400, textAlign: 'center' }}>
        <Title level={3}>等待SSO数据</Title>
        <Text type="secondary">
          正在等待SSO服务器发送认证数据...
        </Text>
      </Card>
    </div>
  );
};

export default SSOCallback;
