import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import ssoConfig from './config';

interface SSOData {
  idp: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: string;
  state: string;
  user_info: any;
  verify?: any; // verify 对象，包含 timestamp 和 public_secret
}

export class SSOController {
  // 验证 SSO 来源合法性
  private static async validateSSOSource(timestamp: string, public_secret: string): Promise<boolean> {
    try {
      // 使用 bcrypt.compare 来验证
      const isValid = await bcrypt.compare(timestamp + ssoConfig.salt, public_secret);
      
      console.log('SSO 验证详情:', {
        timestamp,
        salt: ssoConfig.salt,
        isValid
      });
      
      return isValid;

    } catch (error) {
      console.error('实现 SSO 验证过程失败:', error);
      return false;
    }
  }

  // 处理 SSO 回调
  static async handleCallback(req: Request, res: Response): Promise<void> {
    try {
      console.log('SSO Callback received');
      console.log('Request body:', req.body);
      
      // 检查请求体是否存在
      if (!req.body) {
        res.status(400).send('请求体为空');
        return;
      }
      
      // 从表单数据中获取数据
      const {
        idp,
        access_token,
        refresh_token,
        token_type,
        expires_in,
        state,
        user_info,
        verify
      } = req.body as SSOData & { verify?: any };

      // 从 verify 对象中提取 timestamp 和 public_secret
      let timestamp: string = '';
      let public_secret: string = '';
      
      // 解析 verify 字段
      let verifyObj: any = null;
      if (verify) {
        if (typeof verify === 'string') {
          try {
            verifyObj = JSON.parse(verify);
            console.log('Parsed verify string:', verifyObj);
          } catch (error) {
            console.error('Failed to parse verify string:', error);
          }
        } else if (typeof verify === 'object') {
          verifyObj = verify;
          console.log('Verify is already an object:', verifyObj);
        }
      }
      
      if (verifyObj && verifyObj.timestamp && verifyObj.public_secret) {
        // 从解析后的 verify 对象中提取参数
        timestamp = verifyObj.timestamp;
        public_secret = verifyObj.public_secret;
        console.log('Extracted from verify object:', { timestamp, public_secret });
      } else {
        console.error('Failed to extract timestamp and public_secret from verify object');
      }

      // 验证必填参数
      const requiredParams = {
        idp: '身份提供者标识',
        access_token: '访问令牌',
        refresh_token: '刷新令牌',
        token_type: '令牌类型',
        expires_in: '过期时间',
        user_info: '用户信息',
        timestamp: '时间戳',
        public_secret: '公钥验证'
      };

      // 检查时间戳和公钥验证参数
      const hasTimestamp = timestamp && timestamp.trim() !== '';
      const hasPublicSecret = public_secret && public_secret.trim() !== '';
      
      const missingParams = Object.entries(requiredParams)
        .filter(([key]) => {
          if (key === 'timestamp') {
            return !hasTimestamp;
          }
          if (key === 'public_secret') {
            return !hasPublicSecret;
          }
          return !req.body[key];
        })
        .map(([_, label]) => label);

      if (missingParams.length > 0) {
        console.error('Missing params:', missingParams);
        
        // 重定向到错误页面
        const message = `缺少以下必填参数：${missingParams.join('、')}`;
        // res.redirect(`/auth-error?error=${errorParams}`);
        res.status(200).send(message)
        
        return;
      }

      // 检查是否是验证时间戳过期
      const currentTime = Date.now();
      const requestTime = parseInt(timestamp);
      const timeDiff = currentTime - requestTime;
      const maxValidTime = 30 * 60 * 1000; // 30分钟
      const isExpired = timeDiff > maxValidTime;
      if(isExpired){
        res.status(200).send('SSO 请求已过期，请重新发起认证');
        return;
      }

      // 验证 SSO 来源合法性
      const isValidSource = await SSOController.validateSSOSource(timestamp, public_secret);
      if (!isValidSource) {
        const errorMessage = 'SSO 来源验证失败，请求可能来自非法来源';
        res.status(200).send(errorMessage);
        return;
      }

      // 验证 idp
      if (idp !== 'IAM') {
        console.error('Invalid IDP:', idp);
        
        const message = `不支持的身份提供者：${idp}`;
        res.status(200).send(message);
        
        return;
      }

      // 解析用户信息
      let parsedUserInfo;
      try {
        parsedUserInfo = typeof user_info === 'string' ? JSON.parse(user_info) : user_info;
        console.log('Parsed user info:', parsedUserInfo);
      } catch (error) {
        console.error('Invalid user info format:', error);
        const message = '用户信息不是有效的 JSON 格式';
        res.status(200).send(message);
        return;
      }

      // 验证用户信息必填字段
      const requiredFields = {
        user_id: '用户ID',
        username: '用户名',
        // name: '姓名',
        // email: '邮箱',
        // status: '状态'
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key]) => !parsedUserInfo[key])
        .map(([_, label]) => label);

      if (missingFields.length > 0) {
        console.error('Missing user fields:', missingFields);
        
        const message = `用户信息缺少以下必填字段：${missingFields.join('、')}`
        res.status(200).send(message);
        
        return;
      }

      // 验证用户状态
      if (parsedUserInfo.status !== 'ACTIVE') {
        console.error('Invalid user status:', parsedUserInfo.status);
        
        const message = `当前用户状态：${parsedUserInfo.status}，需要 ACTIVE 状态才能登录`;
        res.status(200).send(message);
        
        return;
      }

      // 生成本系统的 JWT token
      const systemToken = jwt.sign(
        {
          user_id: parsedUserInfo.user_id,
          username: parsedUserInfo.username,
          name: parsedUserInfo.name,
          avatar: parsedUserInfo.avatar,
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
        avatar: parsedUserInfo.avatar,
        email: parsedUserInfo.email,
        phone: parsedUserInfo.phone,
        gender: parsedUserInfo.gender,
        status: parsedUserInfo.status,
        department_id: parsedUserInfo.department_id,
      };

      console.log('userData:', userData);
      
      // 将token和用户信息编码后重定向到前端
      const successData = encodeURIComponent(JSON.stringify({
        token: systemToken,
        user: userData,
        success: true
      }));

      console.log('successData:', successData);
      
      // 重定向到前端页面，传递认证数据
      res.redirect(`${ssoConfig.frontend_url}/sso-success?data=${successData}`);
      
      
    } catch (error) {
      console.error('SSO 回调处理错误:', error);

      const message = error instanceof Error ? error.message : '未知错误';
      res.status(200).send(message);
      
    }
  }
}
