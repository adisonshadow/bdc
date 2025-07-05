import React from 'react';
import Lottie from 'lottie-react-web';
import animation from '@/assets/loading.json';
import './index.less';

// 暂时使用简单的加载动画，后续可以替换为 dotlottie
interface AILoadingProps {
  visible: boolean;
  text?: string;
}

interface AILoadingProps {
  visible: boolean;
  text?: string;
}

const AILoading: React.FC<AILoadingProps> = ({ 
  visible, 
  text = 'AI 正在思考中...' 
}) => {
  if (!visible) return null;

  return (
    <div className="ai-loading-overlay">
      <div className="ai-loading-container">
        <div className="ai-loading-animation">
          <Lottie
            options={{
              animationData: animation,
              loop: true,
              autoplay: true
            }}
            width={120}
            height={120}
          />
        </div>
        <div className="ai-loading-text">
          {text}
        </div>
      </div>
    </div>
  );
};

export default AILoading; 