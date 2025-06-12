// 基础错误类
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 验证错误
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

// 认证错误
export class AuthenticationError extends AppError {
  constructor(message: string = '未认证') {
    super('AUTHENTICATION_ERROR', message, 401);
  }
}

// 授权错误
export class AuthorizationError extends AppError {
  constructor(message: string = '无权限') {
    super('AUTHORIZATION_ERROR', message, 403);
  }
}

// 资源未找到错误
export class NotFoundError extends AppError {
  constructor(message: string = '资源未找到') {
    super('NOT_FOUND_ERROR', message, 404);
  }
}

// 业务逻辑错误
export class BusinessError extends AppError {
  constructor(message: string, details?: any) {
    super('BUSINESS_ERROR', message, 400, details);
  }
}

// 数据库错误
export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super('DATABASE_ERROR', message, 500, details);
  }
}

// 外部服务错误
export class ExternalServiceError extends AppError {
  constructor(message: string, details?: any) {
    super('EXTERNAL_SERVICE_ERROR', message, 502, details);
  }
}

// 验证警告（非阻塞性）
export class ValidationWarning extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_WARNING', message, 200, details);
  }
} 