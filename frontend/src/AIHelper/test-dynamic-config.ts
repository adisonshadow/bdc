// 测试动态AI配置功能

import { aiConfigService, aiService } from './index';

export async function testDynamicConfig() {
  console.log('=== 测试动态AI配置功能 ===');
  
  try {
    // 1. 检查是否有可用配置
    console.log('1. 检查AI配置可用性...');
    const hasConfig = await aiConfigService.hasAvailableConfig();
    console.log('是否有可用配置:', hasConfig);
    
    if (!hasConfig) {
      console.log('没有可用配置，请先添加AI配置');
      return;
    }
    
    // 2. 获取当前配置
    console.log('2. 获取当前AI配置...');
    const currentConfig = await aiConfigService.getCurrentAiConfig();
    console.log('当前配置:', currentConfig);
    
    // 3. 测试AI服务
    console.log('3. 测试AI服务...');
    const configCheck = await aiService.checkConfigAvailability();
    console.log('配置检查结果:', configCheck);
    
    if (configCheck.available) {
      // 4. 发送测试消息
      console.log('4. 发送测试消息...');
      const response = await aiService.sendMessage('你好，请简单介绍一下你自己');
      console.log('AI回复:', response);
      console.log('✅ 动态AI配置测试成功！');
    } else {
      console.log('❌ AI配置不可用:', configCheck.message);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 在浏览器控制台中运行
if (typeof window !== 'undefined') {
  (window as any).testDynamicConfig = testDynamicConfig;
  console.log('测试函数已挂载到 window.testDynamicConfig');
} 