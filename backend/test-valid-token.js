const http = require('http');
const jwt = require('jsonwebtoken');

// 生成一个有效的测试token
const testUser = {
  user_id: '10000000-0000-0000-0000-000000000001',
  username: 'admin',
  name: 'admin',
  avatar: '1fa0a3de-d1d2-406f-89f0-a9522e0c0c3a',
  email: 'admin@test.com',
  phone: '18622223333',
  gender: 'MALE',
  status: 'ACTIVE',
  department_id: null,
  sso_token: {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    token_type: 'Bearer',
    expires_in: 3600,
    state: 'test-state'
  }
};

const validToken = jwt.sign(testUser, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });

console.log('生成的测试token:', validToken.substring(0, 50) + '...');

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
function testEndpoint(endpoint, token) {
  return new Promise((resolve) => {
    const options = {
      hostname: config.host,
      port: config.port,
      path: endpoint,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          endpoint,
          statusCode: res.statusCode,
          response: data.substring(0, 200) + (data.length > 200 ? '...' : '')
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        endpoint,
        statusCode: 'ERROR',
        error: err.message
      });
    });

    req.end();
  });
}

// 运行测试
async function runTests() {
  console.log('🔍 开始测试有效token...\n');

  for (const endpoint of config.endpoints) {
    console.log(`测试端点: ${endpoint}`);
    
    const result = await testEndpoint(endpoint, validToken);
    console.log(`  状态码: ${result.statusCode}`);
    
    if (result.statusCode === 200) {
      console.log(`  ✅ ${endpoint} 认证成功`);
    } else if (result.statusCode === 401) {
      console.log(`  ❌ ${endpoint} 认证失败`);
    } else {
      console.log(`  ⚠️  ${endpoint} 其他状态: ${result.statusCode}`);
    }
    
    console.log('');
  }

  console.log('测试完成！');
}

// 运行测试
runTests().catch(console.error); 