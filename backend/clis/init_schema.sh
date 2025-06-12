#!/bin/bash
set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 输出带颜色的信息函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    if [ "${DEBUG:-false}" = "true" ]; then
        echo -e "${YELLOW}[DEBUG]${NC} $1"
    fi
}

# 检查脚本执行权限
if [ ! -x "$0" ]; then
    log_error "脚本没有执行权限，请先运行: chmod +x $0"
    exit 1
fi

# 检查 psql 命令是否存在
if ! command -v psql &> /dev/null; then
    log_error "psql 命令未找到，请确保 PostgreSQL 客户端已安装"
    exit 1
fi

# 检查环境变量
if [ -z "${DB_HOST:-}" ]; then
    log_error "环境变量 DB_HOST 未设置"
    exit 1
fi
if [ -z "${DB_PORT:-}" ]; then
    log_error "环境变量 DB_PORT 未设置"
    exit 1
fi
if [ -z "${DB_USER:-}" ]; then
    log_error "环境变量 DB_USER 未设置"
    exit 1
fi
if [ -z "${DB_NAME:-}" ]; then
    log_error "环境变量 DB_NAME 未设置"
    exit 1
fi

# 检查数据库连接
log_info "检查数据库连接..."
if ! PGPASSWORD="${DB_PASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &> /dev/null; then
    log_error "无法连接到数据库，请检查连接信息"
    log_debug "连接信息: host=$DB_HOST, port=$DB_PORT, user=$DB_USER, dbname=$DB_NAME"
    exit 1
fi

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INIT_SQL_PATH="$SCRIPT_DIR/../sqls/init_schema.sql"

# 检查初始化SQL文件是否存在
if [ ! -f "$INIT_SQL_PATH" ]; then
    log_error "初始化SQL文件不存在: $INIT_SQL_PATH"
    exit 1
fi

# 创建临时SQL文件
TEMP_SQL=$(mktemp)
trap 'rm -f "$TEMP_SQL"' EXIT

# 生成清空schema的SQL
cat > "$TEMP_SQL" << 'EOF'
-- 设置输出格式
\pset format wrapped
\pset expanded on

-- 检查schema是否存在并清空
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'bdc') THEN
        DROP SCHEMA bdc CASCADE;
        RAISE NOTICE 'Schema bdc 已清空';
    ELSE
        RAISE NOTICE 'Schema bdc 不存在，无需清空';
    END IF;
END $$;

-- 执行初始化SQL
\i :init_sql_path

-- 等待表创建完成
DO $$
DECLARE
    max_attempts INTEGER := 10;
    attempt INTEGER := 0;
    tables_exist BOOLEAN := FALSE;
BEGIN
    WHILE attempt < max_attempts AND NOT tables_exist LOOP
        attempt := attempt + 1;
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'bdc' 
            AND table_name IN ('enums', 'data_structures', 'migrations_history')
        ) INTO tables_exist;
        
        IF NOT tables_exist THEN
            PERFORM pg_sleep(0.5);  -- 等待0.5秒
        END IF;
    END LOOP;
    
    IF NOT tables_exist THEN
        RAISE EXCEPTION '表创建超时，请检查初始化SQL是否正确执行';
    END IF;
END $$;

-- 验证初始化结果
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'bdc' AND table_name = t.table_name) as column_count,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'bdc' AND tablename = t.table_name) as index_count,
    CASE 
        WHEN table_name = 'enums' THEN (SELECT COUNT(*) FROM bdc.enums)
        WHEN table_name = 'data_structures' THEN (SELECT COUNT(*) FROM bdc.data_structures)
        WHEN table_name = 'migrations_history' THEN (SELECT COUNT(*) FROM bdc.migrations_history)
        ELSE 0
    END as row_count
FROM information_schema.tables t
WHERE table_schema = 'bdc'
ORDER BY table_name;

-- 显示表结构
SELECT 
    schemaname as schema,
    tablename as table,
    tableowner as owner,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename) - pg_relation_size(schemaname || '.' || tablename)) as index_size,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = t.schemaname AND tablename = t.tablename) as index_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = t.schemaname AND table_name = t.tablename) as column_count
FROM pg_tables t
WHERE schemaname = 'bdc'
ORDER BY tablename;

-- 显示索引信息
SELECT 
    schemaname as schema,
    tablename as table,
    indexname as index,
    indexdef as definition
FROM pg_indexes
WHERE schemaname = 'bdc'
ORDER BY tablename, indexname;
EOF

log_info "开始初始化数据库..."
log_info "数据库连接信息:"
log_info "  主机: $DB_HOST"
log_info "  端口: $DB_PORT"
log_info "  用户: $DB_USER"
log_info "  数据库: $DB_NAME"
log_info "  初始化SQL文件: $INIT_SQL_PATH"

# 执行SQL并捕获输出
log_info "执行SQL初始化..."
SQL_OUTPUT=$(mktemp)
SQL_ERROR=$(mktemp)
trap 'rm -f "$SQL_OUTPUT" "$SQL_ERROR"' EXIT

if ! PGPASSWORD="${DB_PASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -v "init_sql_path=$INIT_SQL_PATH" \
    -f "$TEMP_SQL" > "$SQL_OUTPUT" 2> "$SQL_ERROR"; then
    log_error "SQL执行失败！"
    log_error "错误信息:"
    cat "$SQL_ERROR"
    log_debug "完整输出日志:"
    cat "$SQL_OUTPUT"
    exit 1
fi

# 检查执行结果
if grep -i "error" "$SQL_ERROR" > /dev/null; then
    log_error "SQL执行过程中出现错误:"
    cat "$SQL_ERROR"
    exit 1
fi

if [ -s "$SQL_ERROR" ]; then
    log_warn "SQL执行过程中出现警告:"
    cat "$SQL_ERROR"
fi

log_info "SQL执行成功！"
log_info "初始化结果:"
cat "$SQL_OUTPUT"

# 清理临时文件
rm -f "$SQL_OUTPUT" "$SQL_ERROR"

log_info "数据库初始化完成！" 