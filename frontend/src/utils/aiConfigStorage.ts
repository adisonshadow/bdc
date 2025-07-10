// AI配置本地存储工具函数

const SELECTED_AI_CONFIG_KEY = 'selectedAiConfigId';

/**
 * 保存选择的AI配置ID
 */
export const saveSelectedAiConfig = (configId: string) => {
  localStorage.setItem(SELECTED_AI_CONFIG_KEY, configId);
};

/**
 * 获取保存的AI配置ID
 */
export const getSelectedAiConfigId = (): string | null => {
  return localStorage.getItem(SELECTED_AI_CONFIG_KEY);
};

/**
 * 清除保存的AI配置ID
 */
export const clearSelectedAiConfig = () => {
  localStorage.removeItem(SELECTED_AI_CONFIG_KEY);
};

/**
 * 检查是否有保存的AI配置
 */
export const hasSelectedAiConfig = (): boolean => {
  return !!getSelectedAiConfigId();
}; 