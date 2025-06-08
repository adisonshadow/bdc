#!/bin/bash
set -e

# 检查环境变量
if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
  echo "错误: 请先设置数据库环境变量"
  echo "示例:"
  echo "export DB_HOST=localhost"
  echo "export DB_PORT=15432"
  echo "export DB_USER=yoyo"
  echo "export DB_NAME=fyMOM"
  exit 1
fi

# 执行SQL文件
echo "正在加载mock数据..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/../sqls/mockdata.sql"

echo "mock数据加载完成！" 