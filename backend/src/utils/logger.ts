import winston from 'winston';

// 定义日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 定义日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// 添加颜色
winston.addColors(colors);

// 定义日志格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${typeof info.message === 'object' ? JSON.stringify(info.message, null, 2) : info.message}`,
  ),
);

// 定义日志输出目标
const transports = [
  // 控制台输出
  new winston.transports.Console(),
  // 错误日志文件
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  // 所有日志文件
  new winston.transports.File({ filename: 'logs/all.log' }),
];

// 创建 logger 实例
const logger = winston.createLogger({
  level: 'info', // 默认级别
  levels,
  format,
  transports,
});

// 导出类型
export type LogMessage = string | number | boolean | object;
export type Logger = {
  error: (message: LogMessage) => void;
  warn: (message: LogMessage) => void;
  info: (message: LogMessage) => void;
  http: (message: LogMessage) => void;
  debug: (message: LogMessage) => void;
};
export type LoggerStream = {
  write: (message: string) => void;
};

// 导出包装后的 Logger
export const Logger = {
  error: (message: any) => logger.error(message),
  warn: (message: any) => logger.warn(message),
  info: (message: any) => logger.info(message),
  http: (message: any) => logger.http(message),
  debug: (message: any) => logger.debug(message),
};

// 创建请求日志流
export const stream: LoggerStream = {
  write: (message: string) => {
    Logger.http(message.trim());
  },
}; 