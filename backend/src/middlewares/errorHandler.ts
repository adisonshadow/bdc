import { GraphQLFormattedError } from 'graphql';
import { AppError } from '../errors/types';
import { Logger } from '../utils/logger';

export const errorHandler = {
  formatError: (formattedError: GraphQLFormattedError, error: unknown): GraphQLFormattedError => {
    // 记录原始错误
    if (error instanceof Error) {
      Logger.error('GraphQL Error:', {
        error: error.message,
        stack: error.stack,
        path: formattedError.path,
      });
    }

    // 处理自定义错误
    if (error instanceof AppError) {
      return {
        message: error.message,
        extensions: {
          code: error.code,
          statusCode: error.statusCode,
          details: error.details,
        },
        path: formattedError.path,
      };
    }

    // 处理其他错误
    return {
      message: formattedError.message,
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
      },
      path: formattedError.path,
    };
  },
}; 