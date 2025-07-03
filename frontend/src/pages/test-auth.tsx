import React, { useEffect, useState } from 'react';
import { Card, Button, message, Space } from 'antd';
import { request } from '@umijs/max';

const TestAuth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // 测试需要认证的API
  const testAuthApi = async () => {
    setLoading(true);
    try {
      const response = await request('/api/test/auth', {
        method: 'GET',
      });
      setResult(response);
      message.success('认证API请求成功');
    } catch (error) {
      console.error('认证API请求失败:', error);
      setResult(error);
      message.error('认证API请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 测试无需认证的API
  const testPublicApi = async () => {
    setLoading(true);
    try {
      const response = await request('/api/test/public', {
        method: 'GET',
      });
      setResult(response);
      message.success('公开API请求成功');
    } catch (error) {
      console.error('公开API请求失败:', error);
      setResult(error);
      message.error('公开API请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 测试401错误
  const testUnauthorized = async () => {
    setLoading(true);
    try {
      const response = await request('/api/test/unauthorized', {
        method: 'GET',
      });
      setResult(response);
      message.success('401错误API请求成功');
    } catch (error) {
      console.error('401错误API请求失败:', error);
      setResult(error);
      message.error('401错误API请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 测试业务错误
  const testBusinessError = async () => {
    setLoading(true);
    try {
      const response = await request('/api/test/error', {
        method: 'GET',
      });
      setResult(response);
      message.success('业务错误API请求成功');
    } catch (error) {
      console.error('业务错误API请求失败:', error);
      setResult(error);
      message.error('业务错误API请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 测试token管理
  const testTokenStats = async () => {
    setLoading(true);
    try {
      const response = await request('/api/test/token-stats', {
        method: 'GET',
      });
      setResult(response);
      message.success('Token管理测试成功');
    } catch (error) {
      console.error('Token管理测试失败:', error);
      setResult(error);
      message.error('Token管理测试失败');
    } finally {
      setLoading(false);
    }
  };

  // 测试token管理API
  const testTokenManagement = async () => {
    setLoading(true);
    try {
      const response = await request('/api/token-management/stats', {
        method: 'GET',
      });
      setResult(response);
      message.success('Token管理API测试成功');
    } catch (error) {
      console.error('Token管理API测试失败:', error);
      setResult(error);
      message.error('Token管理API测试失败');
    } finally {
      setLoading(false);
    }
  };

  // 测试无token的情况
  const testNoToken = async () => {
    setLoading(true);
    // 临时清除token
    const originalToken = localStorage.getItem('token');
    localStorage.removeItem('token');
    
    try {
      const response = await request('/api/test/auth', {
        method: 'GET',
      });
      setResult(response);
      message.success('无tokenAPI请求成功');
    } catch (error) {
      console.error('无tokenAPI请求失败:', error);
      setResult(error);
      message.error('无tokenAPI请求失败');
    } finally {
      // 恢复token
      if (originalToken) {
        localStorage.setItem('token', originalToken);
      }
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title="请求拦截器测试" style={{ maxWidth: 800, margin: '0 auto' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            type="primary" 
            onClick={testAuthApi} 
            loading={loading}
            block
          >
            测试需要认证的API
          </Button>
          
          <Button 
            onClick={testPublicApi} 
            loading={loading}
            block
          >
            测试公开API
          </Button>
          
          <Button 
            onClick={testUnauthorized} 
            loading={loading}
            block
          >
            测试401错误
          </Button>
          
          <Button 
            onClick={testBusinessError} 
            loading={loading}
            block
          >
            测试业务错误
          </Button>
          
          <Button 
            onClick={testTokenStats} 
            loading={loading}
            block
          >
            测试Token管理
          </Button>
          
          <Button 
            onClick={testTokenManagement} 
            loading={loading}
            block
          >
            测试Token管理API
          </Button>
          
          <Button 
            danger
            onClick={testNoToken} 
            loading={loading}
            block
          >
            测试无token情况
          </Button>
          
          {result && (
            <Card title="请求结果" size="small">
              <pre style={{ fontSize: 12, overflow: 'auto' }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </Card>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default TestAuth;
