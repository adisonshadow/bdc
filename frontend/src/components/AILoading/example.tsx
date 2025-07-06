import React, { useState } from 'react';
import { Button, Space, Card, Typography, Divider } from 'antd';
import { RobotOutlined, ThunderboltOutlined, BulbOutlined } from '@ant-design/icons';
import AILoading from './index';

const { Title, Paragraph } = Typography;

const AILoadingExample: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // 模拟 AI 分析过程
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      // 模拟 AI 分析时间
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('AI 分析完成');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 模拟 AI 生成过程
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // 模拟 AI 生成时间
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log('AI 生成完成');
    } finally {
      setIsGenerating(false);
    }
  };

  // 模拟 AI 优化过程
  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      // 模拟 AI 优化时间
      await new Promise(resolve => setTimeout(resolve, 4000));
      console.log('AI 优化完成');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>AILoading 组件使用示例</Title>
      
      <Card title="基本用法" style={{ marginBottom: '16px' }}>
        <Paragraph>
          AILoading 组件用于在 AI 处理过程中显示全屏加载动画，提供良好的用户体验反馈。
        </Paragraph>
        
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            type="primary" 
            icon={<RobotOutlined />}
            onClick={handleAnalyze}
            loading={isAnalyzing}
            block
          >
            {isAnalyzing ? 'AI 分析中...' : '开始 AI 分析'}
          </Button>
          
          <Button 
            type="default" 
            icon={<ThunderboltOutlined />}
            onClick={handleGenerate}
            loading={isGenerating}
            block
          >
            {isGenerating ? 'AI 生成中...' : '开始 AI 生成'}
          </Button>
          
          <Button 
            type="dashed" 
            icon={<BulbOutlined />}
            onClick={handleOptimize}
            loading={isOptimizing}
            block
          >
            {isOptimizing ? 'AI 优化中...' : '开始 AI 优化'}
          </Button>
        </Space>
      </Card>

      <Card title="使用场景" style={{ marginBottom: '16px' }}>
        <Paragraph>
          <strong>适用场景：</strong>
        </Paragraph>
        <ul>
          <li>AI 模型训练和推理</li>
          <li>数据分析和处理</li>
          <li>代码生成和优化</li>
          <li>智能推荐和预测</li>
          <li>自然语言处理</li>
        </ul>
      </Card>

      <Card title="最佳实践">
        <Paragraph>
          <strong>使用建议：</strong>
        </Paragraph>
        <ul>
          <li>只在 AI 处理时间较长时使用（建议超过 1 秒）</li>
          <li>提供清晰的进度提示文字</li>
          <li>确保在异常情况下也能正确隐藏</li>
          <li>避免频繁显示/隐藏，影响用户体验</li>
          <li>配合错误处理机制使用</li>
        </ul>
      </Card>

      {/* AILoading 组件 */}
      <AILoading 
        visible={isAnalyzing} 
        text="AI 正在分析数据模型..." 
      />
      
      <AILoading 
        visible={isGenerating} 
        text="AI 正在生成代码..." 
      />
      
      <AILoading 
        visible={isOptimizing} 
        text="AI 正在优化性能..." 
      />
    </div>
  );
};

export default AILoadingExample; 