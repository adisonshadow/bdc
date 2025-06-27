import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

interface SSOData {
  idp: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: string;
  state: string;
  user_info: any;
}

export class SSOController {
  // 处理 SSO 回调
  static async handleCallback(req: Request, res: Response): Promise<void> {
    try {
      console.log('SSO Callback received:', req.body);
      
      // 从请求体中获取数据
      const {
        idp,
        access_token,
        refresh_token,
        token_type,
        expires_in,
        state,
        user_info
      } = req.body as SSOData;

      // 验证必填参数
      const requiredParams = {
        idp: '身份提供者标识',
        access_token: '访问令牌',
        refresh_token: '刷新令牌',
        token_type: '令牌类型',
        expires_in: '过期时间',
        user_info: '用户信息'
      };

      const missingParams = Object.entries(requiredParams)
        .filter(([key]) => !req.body[key])
        .map(([_, label]) => label);

      if (missingParams.length > 0) {
        console.error('Missing params:', missingParams);
        // 重定向到错误页面
        const errorParams = encodeURIComponent(JSON.stringify({
          error: 'MISSING_PARAMS',
          message: `缺少以下必填参数：${missingParams.join('、')}`
        }));
        res.redirect(`/auth-error?error=${errorParams}`);
        return;
      }

      // 验证 idp
      if (idp !== 'IAM') {
        console.error('Invalid IDP:', idp);
        const errorParams = encodeURIComponent(JSON.stringify({
          error: 'INVALID_IDP',
          message: `不支持的身份提供者：${idp}`
        }));
        res.redirect(`/auth-error?error=${errorParams}`);
        return;
      }

      // 解析用户信息
      let parsedUserInfo;
      try {
        parsedUserInfo = typeof user_info === 'string' ? JSON.parse(user_info) : user_info;
        console.log('Parsed user info:', parsedUserInfo);
      } catch (error) {
        console.error('Invalid user info format:', error);
        const errorParams = encodeURIComponent(JSON.stringify({
          error: 'INVALID_USER_INFO',
          message: '用户信息不是有效的 JSON 格式'
        }));
        res.redirect(`/auth-error?error=${errorParams}`);
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
        console.error('Missing user fields:', missingFields);
        const errorParams = encodeURIComponent(JSON.stringify({
          error: 'INCOMPLETE_USER_INFO',
          message: `用户信息缺少以下必填字段：${missingFields.join('、')}`
        }));
        res.redirect(`/auth-error?error=${errorParams}`);
        return;
      }

      // 验证用户状态
      if (parsedUserInfo.status !== 'ACTIVE') {
        console.error('Invalid user status:', parsedUserInfo.status);
        const errorParams = encodeURIComponent(JSON.stringify({
          error: 'INVALID_USER_STATUS',
          message: `当前用户状态：${parsedUserInfo.status}，需要 ACTIVE 状态才能登录`
        }));
        res.redirect(`/auth-error?error=${errorParams}`);
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
          // 保存 SSO 的 token 信息
          sso_token: {
            access_token,
            refresh_token,
            token_type,
            expires_in: parseInt(expires_in),
            state
          },
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // 构建用户信息
      const userData = {
        user_id: parsedUserInfo.user_id,
        username: parsedUserInfo.username,
        name: parsedUserInfo.name,
        email: parsedUserInfo.email,
        phone: parsedUserInfo.phone,
        gender: parsedUserInfo.gender,
        status: parsedUserInfo.status,
        department_id: parsedUserInfo.department_id,
      };

      // 将token和用户信息编码后重定向到前端
      const successData = encodeURIComponent(JSON.stringify({
        token: systemToken,
        user: userData,
        success: true
      }));

      console.log('SSO Callback success, redirecting to frontend');
      
      // 重定向到前端页面，传递认证数据
      res.redirect(`/auth-success?data=${successData}`);
      
    } catch (error) {
      console.error('SSO 回调处理错误:', error);
      const errorParams = encodeURIComponent(JSON.stringify({
        error: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : '未知错误'
      }));
      res.redirect(`/auth-error?error=${errorParams}`);
    }
  }
}
