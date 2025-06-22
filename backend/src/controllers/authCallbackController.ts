import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface ErrorResponse {
  success: false;
  message: string;
  details: string;
  code?: string;
}

interface SuccessResponse {
  success: true;
  token: string;
  user: {
    user_id: string;
    username: string;
    name: string;
    email: string;
    phone?: string;
    gender?: string;
    status: string;
    department_id?: string;
  };
}

export class AuthCallbackController {
  // 处理 IAM 系统的回调
  static async handleCallback(req: Request, res: Response): Promise<void> {
    try {
      // 从请求体中获取 IAM 系统传递的信息
      const {
        idp,
        timestamp,
        access_token,
        refresh_token,
        token_type,
        expires_in,
        client_signature,
        user_info
      } = req.body;

      // 验证必填参数
      const requiredParams = {
        idp: '身份提供者标识',
        timestamp: '时间戳',
        access_token: '访问令牌',
        token_type: '令牌类型',
        expires_in: '过期时间',
        client_signature: '客户端签名',
        user_info: '用户信息'
      };

      const missingParams = Object.entries(requiredParams)
        .filter(([key]) => !req.body[key])
        .map(([_, label]) => label);

      if (missingParams.length > 0) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '缺少必要的认证信息',
          details: `缺少以下必填参数：${missingParams.join('、')}`,
          code: 'MISSING_PARAMS'
        };
        res.status(400).json(errorResponse);
        return;
      }

      // 验证 idp
      if (idp !== 'IAM') {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '无效的身份提供者',
          details: `不支持的身份提供者：${idp}，当前仅支持 IAM`,
          code: 'INVALID_IDP'
        };
        res.status(400).json(errorResponse);
        return;
      }

      // 验证时间戳（5分钟内有效）
      const now = Date.now();
      const requestTime = parseInt(timestamp);
      if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '请求已过期',
          details: `请求时间戳：${new Date(requestTime).toLocaleString()}，当前时间：${new Date(now).toLocaleString()}`,
          code: 'EXPIRED_REQUEST'
        };
        res.status(400).json(errorResponse);
        return;
      }

      // 验证客户端签名
      const clientSecret = process.env.CLIENT_SECRET;
      if (!clientSecret) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '服务器配置错误',
          details: '未配置客户端密钥（CLIENT_SECRET）',
          code: 'SERVER_CONFIG_ERROR'
        };
        res.status(500).json(errorResponse);
        return;
      }

      const message = `${timestamp}${clientSecret}`;
      const expectedSignature = crypto
        .createHash('sha256')
        .update(message)
        .digest('base64');

      if (client_signature !== expectedSignature) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '无效的客户端签名',
          details: '客户端签名验证失败，请确认客户端密钥是否正确',
          code: 'INVALID_SIGNATURE'
        };
        res.status(400).json(errorResponse);
        return;
      }

      // 解析用户信息
      let parsedUserInfo;
      try {
        parsedUserInfo = typeof user_info === 'string' ? JSON.parse(user_info) : user_info;
      } catch (error) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '无效的用户信息格式',
          details: '用户信息不是有效的 JSON 格式',
          code: 'INVALID_USER_INFO'
        };
        res.status(400).json(errorResponse);
        return;
      }

      // 验证用户信息必填字段
      const requiredFields = {
        user_id: '用户ID',
        username: '用户名',
        name: '姓名',
        email: '邮箱',
        status: '状态'
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key]) => !parsedUserInfo[key])
        .map(([_, label]) => label);

      if (missingFields.length > 0) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '用户信息不完整',
          details: `用户信息缺少以下必填字段：${missingFields.join('、')}`,
          code: 'INCOMPLETE_USER_INFO'
        };
        res.status(400).json(errorResponse);
        return;
      }

      // 验证用户状态
      if (parsedUserInfo.status !== 'ACTIVE') {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '用户状态异常',
          details: `当前用户状态：${parsedUserInfo.status}，需要 ACTIVE 状态才能登录`,
          code: 'INVALID_USER_STATUS'
        };
        res.status(400).json(errorResponse);
        return;
      }

      // 生成本系统的 JWT token
      const systemToken = jwt.sign(
        {
          user_id: parsedUserInfo.user_id,
          username: parsedUserInfo.username,
          name: parsedUserInfo.name,
          email: parsedUserInfo.email,
          phone: parsedUserInfo.phone,
          gender: parsedUserInfo.gender,
          status: parsedUserInfo.status,
          department_id: parsedUserInfo.department_id,
          // 保存 IAM 的 token 信息
          iam_token: {
            access_token,
            refresh_token,
            token_type,
            expires_in: parseInt(expires_in),
          },
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // 返回成功响应
      const successResponse: SuccessResponse = {
        success: true,
        token: systemToken,
        user: {
          user_id: parsedUserInfo.user_id,
          username: parsedUserInfo.username,
          name: parsedUserInfo.name,
          email: parsedUserInfo.email,
          phone: parsedUserInfo.phone,
          gender: parsedUserInfo.gender,
          status: parsedUserInfo.status,
          department_id: parsedUserInfo.department_id,
        }
      };

      res.json(successResponse);
    } catch (error) {
      console.error('认证回调处理错误:', error);
      const errorResponse: ErrorResponse = {
        success: false,
        message: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误',
        code: 'INTERNAL_SERVER_ERROR'
      };
      res.status(500).json(errorResponse);
    }
  }
} 