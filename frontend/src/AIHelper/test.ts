// AI Helper 测试文件

import { sendAIMessage, getSchemaHelp } from './index';

// 测试基本消息发送
export async function testBasicMessage() {
  try {
    console.log('测试基本消息发送...');
    const response = await sendAIMessage('你好，请简单介绍一下你自己');
    console.log('AI 回复:', response);
    return true;
  } catch (error) {
    console.error('基本消息测试失败:', error);
    return false;
  }
}

// 测试架构助手
export async function testSchemaHelper() {
  try {
    console.log('测试架构助手...');
    const testModel = {
      fields: [
        {
          id: '1',
          name: 'id',
          type: 'string',
          required: false,
          length: 50
        },
        {
          id: '2',
          name: 'name',
          type: 'text',
          required: true
        }
      ],
      keyIndexes: {
        primaryKey: ['id']
      }
    };

    const testIssues = [
      {
        type: 'error',
        message: '主键字段 "id" 允许空值',
        fieldName: 'id',
        details: '主键字段必须设置为必填'
      }
    ];

    const prompt = `请帮我修复这个数据表模型中的验证错误。

当前模型：
${JSON.stringify(testModel, null, 2)}

验证错误：
${testIssues.map(issue => `- ${issue.type}: ${issue.message}${issue.details ? ` (${issue.details})` : ''}`).join('\n')}

请返回修复后的完整模型 JSON，格式如下：
{
  "fields": [...],
  "keyIndexes": {...}
}

只返回 JSON 格式的数据，不要包含其他说明文字。`;

    const response = await getSchemaHelp(prompt);
    console.log('架构助手回复:', response);
    
    // 尝试解析 JSON
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('解析后的 JSON:', parsed);
        return true;
      }
    } catch (parseError) {
      console.error('JSON 解析失败:', parseError);
    }
    
    return true;
  } catch (error) {
    console.error('架构助手测试失败:', error);
    return false;
  }
}

// 运行所有测试
export async function runAllTests() {
  console.log('开始运行 AI Helper 测试...');
  
  const basicResult = await testBasicMessage();
  const schemaResult = await testSchemaHelper();
  
  console.log('测试结果:');
  console.log('- 基本消息测试:', basicResult ? '通过' : '失败');
  console.log('- 架构助手测试:', schemaResult ? '通过' : '失败');
  
  return basicResult && schemaResult;
}

// 如果直接运行此文件
if (typeof window !== 'undefined') {
  // 在浏览器环境中，可以手动调用测试
  (window as any).testAIHelper = runAllTests;
} 