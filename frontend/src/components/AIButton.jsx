import React from 'react';
import { Button } from 'antd';
import styled from 'styled-components';

// 定义默认和悬停时的背景色
const DEFAULT_BACKGROUND = 'radial-gradient(117.61% 84.5% at 147.46% 76.45%, rgba(82, 99, 255, 0.8) 0%, rgba(143, 65, 238, 0) 100%), linear-gradient(72deg, rgb(60, 115, 255) 18.03%, rgb(110, 65, 238) 75.58%, rgb(214, 65, 238) 104.34%)';
const HOVER_BACKGROUND = 'radial-gradient(117.61% 84.5% at 147.46% 76.45%, rgba(92, 109, 255, 0.8) 0%, rgba(153, 75, 248, 0) 100%), linear-gradient(72deg, rgb(70, 125, 255) 18.03%, rgb(120, 75, 248) 75.58%, rgb(224, 75, 248) 104.34%)';

// 自定义样式的 Button 组件
const AIButton = styled(Button)`
  &&& {
    background: ${DEFAULT_BACKGROUND};
    color: #FFF;
    border: none;
    box-shadow: none;
    
    &:hover,
    &:focus {
      background: ${HOVER_BACKGROUND};
      color: #FFF;
      border: none;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }
  }
`;

export default AIButton;  