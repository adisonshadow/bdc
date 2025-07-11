#!/bin/bash

# 数据库迁移脚本
# 执行添加 auth_header 字段的迁移

echo "开始执行数据库迁移..."

# 设置数据库连接参数（从环境变量获取）
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-bdc}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-password}

# 执行迁移脚本
echo "执行迁移脚本: add_auth_header_migration.sql"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f sqls/add_auth_header_migration.sql

if [ $? -eq 0 ]; then
    echo "迁移执行成功！"
else
    echo "迁移执行失败！"
    exit 1
fi 