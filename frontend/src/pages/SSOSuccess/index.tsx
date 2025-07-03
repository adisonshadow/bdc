import React, { useEffect, useState } from 'react';
import { Card, Spin, Alert, Button, Typography, Space, Badge } from 'antd';
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
  user: {
    user_id: string;
    username: string;
    name: string;
    avatar: string;
    email: string;
    phone: string;
    gender: string;
    status: string;
    department_id: string | null;
  };
}

const SSOSuccess: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [success, setSuccess] = useState<SuccessResponse | null>(null);

  useEffect(() => {
    // 检查URL参数中的认证数据
    const checkForAuthData = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const dataParam = urlParams.get('data');
      
      console.log('URL data param:', dataParam);
      
      if (dataParam) {
        try {
          // 解码并解析认证数据
          const decodedData = decodeURIComponent(dataParam);
          const authData = JSON.parse(decodedData) as SuccessResponse;
          
          console.log('Parsed auth data:', authData);
          
          if (authData.success && authData.token && authData.user) {
            setSuccess(authData);
            // 保存认证信息到本地存储
            // 转换用户数据以匹配User接口
            const userData: User = {
              user_id: authData.user.user_id,
              username: authData.user.username,
              name: authData.user.name,
              avatar: authData.user.avatar,
              email: authData.user.email,
              phone: authData.user.phone,
              gender: authData.user.gender,
              status: authData.user.status,
              department_id: authData.user.department_id || undefined
            };
            
            console.log('Original user data:', authData.user);
            console.log('Converted user data:', userData);
            console.log('Avatar field:', userData.avatar);
            
            saveAuthInfo(authData.token, userData);
            
            // 延迟重定向到首页
            setTimeout(() => {
              history.push('/');
            }, 2000);
          } else {
            setError({
              success: false,
              message: '认证数据格式错误',
              details: '接收到的认证数据格式不正确，缺少必要的认证信息。',
              code: 'INVALID_AUTH_DATA'
            });
          }
        } catch (err) {
          console.error('Failed to parse auth data:', err);
          setError({
            success: false,
            message: '数据解析失败',
            details: '无法解析认证数据，可能是数据格式错误或传输过程中出现问题。',
            code: 'PARSE_ERROR'
          });
        }
      } else {
        setError({
          success: false,
          message: '未找到认证数据',
          details: 'SSO成功页面未接收到认证数据。请检查认证流程是否正确。',
          code: 'NO_AUTH_DATA'
        });
      }
      
      setLoading(false);
    };

    // 延迟检查，确保页面完全加载
    setTimeout(checkForAuthData, 100);
  }, []);

  const handleGoHome = () => {
    history.push('/');
  };

  const handleRetry = () => {
    // 重新检查URL参数
    window.location.reload();
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
            欢迎回来，{success.user.username}！
          </Text>
          
          <Alert
            message="用户信息"
            description={
              <div style={{ textAlign: 'left' }}>
                <Text strong>姓名：</Text> {success.user.name}<br />
                <Text strong>邮箱：</Text> {success.user.email}<br />
                <Text strong>状态：</Text> <Badge status="success" className='me-2' /> {success.user.status}
              </div>
            }
            type="success"
            // showIcon
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
        <Title level={3}>等待认证数据</Title>
        <Text type="secondary">
          正在等待认证数据...
        </Text>
      </Card>
    </div>
  );
};

export default SSOSuccess; 