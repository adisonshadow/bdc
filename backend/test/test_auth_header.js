// 测试认证头功能的脚本
const { getDataSource } = require('../src/data-source');
const { AiConfig } = require('../src/models/AiConfig');

async function testAuthHeader() {
  try {
    const dataSource = getDataSource();
    await dataSource.initialize();
    
    const aiConfigRepository = dataSource.getRepository(AiConfig);
    
    // 测试创建带认证头的配置
    console.log('测试创建AI配置...');
    
    const testConfig = aiConfigRepository.create({
      provider: 'Google',
      apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      apiKey: 'test-api-key',
      authHeader: 'X-goog-api-key',
      model: 'gemini-2.0-flash',
      config: { temperature: 0.7 }
    });
    
    const savedConfig = await aiConfigRepository.save(testConfig);
    console.log('✅ 创建成功:', savedConfig);
    
    // 测试查询配置
    console.log('\n测试查询AI配置...');
    const configs = await aiConfigRepository.find();
    console.log('✅ 查询成功，配置数量:', configs.length);
    
    // 测试更新配置
    console.log('\n测试更新AI配置...');
    savedConfig.authHeader = 'Authorization';
    const updatedConfig = await aiConfigRepository.save(savedConfig);
    console.log('✅ 更新成功:', updatedConfig);
    
    // 清理测试数据
    console.log('\n清理测试数据...');
    await aiConfigRepository.remove(savedConfig);
    console.log('✅ 清理完成');
    
    await dataSource.destroy();
    console.log('\n🎉 所有测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testAuthHeader(); 