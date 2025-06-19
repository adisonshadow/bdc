import crypto from 'crypto';

// 加密密钥，应该从环境变量中获取
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-32-chars-long!!';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * 加密数据
 * @param text 要加密的文本
 * @returns 加密后的字符串（Base64格式）
 */
export async function encrypt(text: string): Promise<string> {
  try {
    // 生成随机IV和盐值
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // 使用PBKDF2派生密钥
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha256');

    // 创建加密器
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // 加密数据
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);

    // 获取认证标签
    const tag = cipher.getAuthTag();

    // 组合所有组件：salt + iv + tag + encrypted
    const result = Buffer.concat([salt, iv, tag, encrypted]);

    // 返回Base64编码的结果
    return result.toString('base64');
  } catch (error) {
    console.error('加密失败:', error);
    throw new Error('加密失败');
  }
}

/**
 * 解密数据
 * @param encryptedText 加密的文本（Base64格式）
 * @returns 解密后的字符串
 */
export async function decrypt(encryptedText: string): Promise<string> {
  try {
    // 解码Base64
    const buffer = Buffer.from(encryptedText, 'base64');

    // 提取各个组件
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    // 使用相同的PBKDF2参数派生密钥
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha256');

    // 创建解密器
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // 解密数据
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('解密失败:', error);
    throw new Error('解密失败');
  }
}

/**
 * 生成随机密码
 * @param length 密码长度
 * @returns 随机密码
 */
export function generateRandomPassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  return password;
}

/**
 * 验证密码强度
 * @param password 密码
 * @returns 密码强度评分（0-100）
 */
export function validatePasswordStrength(password: string): number {
  let score = 0;
  
  // 长度检查
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // 字符类型检查
  if (/[a-z]/.test(password)) score += 10;  // 小写字母
  if (/[A-Z]/.test(password)) score += 10;  // 大写字母
  if (/[0-9]/.test(password)) score += 10;  // 数字
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;  // 特殊字符

  // 复杂度检查
  if (/(.)\1{2,}/.test(password)) score -= 10;  // 连续重复字符
  if (/^(123|abc|qwe|asd|zxc)/i.test(password)) score -= 10;  // 常见序列

  return Math.max(0, Math.min(100, score));
} 