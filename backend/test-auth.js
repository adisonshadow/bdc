const http = require('http');

// 测试配置
const config = {
  host: 'localhost',
  port: 3300,
  endpoints: [
    '/api/schemas',
    '/api/enums', 
    '/api/database-connections',
    '/api/materialize-tables',
    '/api/test/auth',
    '/api/token-management/stats'
  ]
};

// 测试函数
function testEndpoint(endpoint, withToken = false) {
  return new Promise((resolve) => {
    const options = {
      hostname: config.host,
      port: config.port,
      path: endpoint,
      method: 'GET',
      headers: {}
    };

    if (withToken) {
      options.headers['Authorization'] = 'Bearer fake-token';
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          endpoint,
          statusCode: res.statusCode,
          withToken,
          response: data.substring(0, 200) + (data.length > 200 ? '...' : '')
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        endpoint,
        statusCode: 'ERROR',
        withToken,
        error: err.message
      });
    });

    req.end();
  });
}

// 运行测试
async function runTests() {
  console.log('🔍 开始测试认证中间件...\n');

  for (const endpoint of config.endpoints) {
    console.log(`测试端点: ${endpoint}`);
    
    // 测试无token访问
    const resultWithoutToken = await testEndpoint(endpoint, false);
    console.log(`  无token: ${resultWithoutToken.statusCode}`);
    
    // 测试有token访问
    const resultWithToken = await testEndpoint(endpoint, true);
    console.log(`  有token: ${resultWithToken.statusCode}`);
    
    // 判断结果
    if (resultWithoutToken.statusCode === 401) {
      console.log(`  ✅ ${endpoint} 认证保护正常`);
    } else {
      console.log(`  ❌ ${endpoint} 认证保护失败 - 无token也能访问`);
    }
    
    console.log('');
  }

  console.log('测试完成！');
}

// 运行测试
runTests().catch(console.error); 