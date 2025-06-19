import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ValidationError } from '../errors/types';

// 扩展 Request 类型以包含 user 属性
declare global {
  namespace Express {
    interface Request {
      user?: {
        username: string;
        role: string;
      };
    }
  }
}

export const authenticateToken = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new ValidationError('未提供认证令牌');
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      username: string;
      role: string;
    };
    req.user = user;
    next();
  } catch (error) {
    throw new ValidationError('无效的认证令牌');
  }
}; 