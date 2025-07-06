import { useState, useCallback } from 'react';

interface UseAILoadingOptions {
  defaultText?: string;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: any) => void;
}

interface UseAILoadingReturn {
  isVisible: boolean;
  text: string;
  startLoading: (text?: string) => void;
  stopLoading: () => void;
  withAILoading: <T>(asyncFn: () => Promise<T>, text?: string) => Promise<T>;
}

/**
 * AI 加载状态管理 Hook
 * 
 * @param options 配置选项
 * @returns AI 加载状态管理对象
 */
export const useAILoading = (options: UseAILoadingOptions = {}): UseAILoadingReturn => {
  const { 
    defaultText = 'AI 正在思考中...', 
    onStart, 
    onComplete, 
    onError 
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [text, setText] = useState(defaultText);

  const startLoading = useCallback((customText?: string) => {
    if (customText) {
      setText(customText);
    }
    setIsVisible(true);
    onStart?.();
  }, [onStart]);

  const stopLoading = useCallback(() => {
    setIsVisible(false);
    onComplete?.();
  }, [onComplete]);

  const withAILoading = useCallback(async <T>(
    asyncFn: () => Promise<T>, 
    customText?: string
  ): Promise<T> => {
    startLoading(customText);
    try {
      const result = await asyncFn();
      return result;
    } catch (error) {
      onError?.(error);
      throw error;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading, onError]);

  return {
    isVisible,
    text,
    startLoading,
    stopLoading,
    withAILoading
  };
};

/**
 * 简化的 AI 加载 Hook，用于快速集成
 */
export const useSimpleAILoading = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [text, setText] = useState('AI 正在思考中...');

  const showLoading = useCallback((customText?: string) => {
    if (customText) {
      setText(customText);
    }
    setIsVisible(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsVisible(false);
  }, []);

  return {
    isVisible,
    text,
    showLoading,
    hideLoading
  };
}; 