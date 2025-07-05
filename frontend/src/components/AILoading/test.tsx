import React, { useState } from 'react';
import { Button, Space } from 'antd';
import AILoading from './index';

const AILoadingTest: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const handleToggle = () => {
    setIsVisible(!isVisible);
  };

  const handleSimulateAI = () => {
    setIsVisible(true);
    // 模拟 AI 处理时间
    setTimeout(() => {
      setIsVisible(false);
    }, 3000);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>AI 加载组件测试</h2>
      <Space>
        <Button onClick={handleToggle}>
          {isVisible ? '隐藏' : '显示'} 加载组件
        </Button>
        <Button type="primary" onClick={handleSimulateAI}>
          模拟 AI 处理（3秒）
        </Button>
      </Space>

      <AILoading 
        visible={isVisible} 
        text="AI 正在思考中..." 
      />
    </div>
  );
};

export default AILoadingTest; 