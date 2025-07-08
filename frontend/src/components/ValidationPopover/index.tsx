import React, { useState } from 'react';
import { Popover, Tag } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import AIButton from '../AIButton';
import { useSimpleAILoading } from '../AILoading/useAILoading';

export interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
}

interface ValidationPopoverProps {
  title: string;
  issues: ValidationIssue[];
  aiButtonText?: string;
  onAIFix?: () => Promise<void>;
  children: React.ReactNode;
  trigger?: 'hover' | 'click';
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
  maxWidth?: number;
  maxHeight?: number;
  showAIFix?: boolean;
}

const ValidationPopover: React.FC<ValidationPopoverProps> = ({
  title,
  issues,
  aiButtonText = 'AI 自动修复',
  onAIFix,
  children,
  trigger = 'click',
  placement = 'top',
  maxWidth = 320,
  maxHeight = 280,
  showAIFix = true
}) => {
  const [popoverVisible, setPopoverVisible] = useState(false);
  const { isVisible: isAutoFixing, text: aiLoadingText, showLoading, hideLoading } = useSimpleAILoading();

  // 处理AI修复
  const handleAIFix = async () => {
    if (!onAIFix) return;
    
    // 关闭Popover
    setPopoverVisible(false);
    
    // 显示AI加载状态
    showLoading('AI 正在分析并修复...');
    
    try {
      await onAIFix();
    } catch (error) {
      console.error('AI修复失败:', error);
    } finally {
      hideLoading();
    }
  };

  const content = (
    <div style={{ maxWidth }}>
      {/* 验证信息展示区域 */}
      <div style={{ maxHeight, overflowY: 'auto' }}>
        {issues.length === 0 ? (
          <div style={{ color: '#52c41a' }}>无异常</div>
        ) : (
          <>
            {issues.map((issue, idx) => (
              <div key={idx} style={{ color: issue.type === 'error' ? 'red' : 'orange', fontSize: 13 }}>
                [{issue.type === 'error' ? '错误' : '警告'}] {issue.message}
              </div>
            ))}
          </>
        )}
      </div>
      
      {/* AI 自动修复按钮 - 在验证信息展示区域外面 */}
      {showAIFix && onAIFix && issues.length > 0 && (
        <div style={{ 
          marginTop: '12px', 
          paddingTop: '12px', 
          textAlign: 'center'
        }}>
          <AIButton
            type="primary"
            icon={<RobotOutlined />}
            loading={isAutoFixing}
            onClick={handleAIFix}
            style={{ 
              width: '100%',
            }}
          >
            {isAutoFixing ? 'AI 修复中...' : aiButtonText}
          </AIButton>
        </div>
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      title={title}
      trigger={trigger}
      placement={placement}
      open={trigger === 'click' ? popoverVisible : undefined}
      onOpenChange={trigger === 'click' ? (visible) => setPopoverVisible(visible) : undefined}
    >
      {children}
    </Popover>
  );
};

export default ValidationPopover; 