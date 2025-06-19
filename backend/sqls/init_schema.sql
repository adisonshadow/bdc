-- 创建 schema（如果不存在）
CREATE SCHEMA IF NOT EXISTS bdc;

-- 设置搜索路径
SET search_path TO bdc, public;

-- 创建 UUID 扩展（如果不存在）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION bdc.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建数据库连接表（在 bdc schema 中）
CREATE TABLE IF NOT EXISTS bdc.database_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(100),
    type VARCHAR(20) NOT NULL CHECK (type IN ('postgresql', 'mysql', 'mongodb', 'sqlserver', 'oracle')),
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    database VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    schema VARCHAR(100),
    sslConfig JSONB,
    poolConfig JSONB,
    monitorConfig JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'testing', 'failed', 'maintenance')),
    allowRemote BOOLEAN DEFAULT false,
    allowedIps VARCHAR(255),
    lastTestAt TIMESTAMP WITH TIME ZONE,
    lastTestSuccess BOOLEAN DEFAULT false,
    lastTestError TEXT,
    stats JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建数据库连接表索引
CREATE INDEX IF NOT EXISTS idx_database_connections_name ON bdc.database_connections(name);
CREATE INDEX IF NOT EXISTS idx_database_connections_type ON bdc.database_connections(type);
CREATE INDEX IF NOT EXISTS idx_database_connections_status ON bdc.database_connections(status);
CREATE INDEX IF NOT EXISTS idx_database_connections_is_active ON bdc.database_connections(is_active);

-- 为数据库连接表添加更新时间触发器
DROP TRIGGER IF EXISTS update_database_connections_updated_at ON bdc.database_connections;
CREATE TRIGGER update_database_connections_updated_at
    BEFORE UPDATE ON bdc.database_connections
    FOR EACH ROW
    EXECUTE FUNCTION bdc.update_updated_at_column();

-- 创建枚举表
CREATE TABLE IF NOT EXISTS bdc.enums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(100),
    options JSONB NOT NULL,
    is_multiple BOOLEAN DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_code_format CHECK (code ~ '^[a-zA-Z][a-zA-Z0-9_:]*$'),
    CONSTRAINT check_name_format CHECK (name ~ '^[a-z][a-z0-9_]*$')
);

-- 创建枚举表索引（移除category、parent_id、sort_order相关索引）
CREATE INDEX IF NOT EXISTS idx_enums_code ON bdc.enums(code);
CREATE INDEX IF NOT EXISTS idx_enums_name ON bdc.enums(name);
CREATE INDEX IF NOT EXISTS idx_enums_is_active ON bdc.enums(is_active);

-- 创建数据结构表
CREATE TABLE IF NOT EXISTS bdc.data_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL UNIQUE,
    fields JSONB NOT NULL,
    key_indexes JSONB,
    physical_storage JSONB,
    validation_errors JSONB,
    description VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_code_format CHECK (code ~ '^[a-zA-Z][a-zA-Z0-9_:]*$'),
    CONSTRAINT check_name_format CHECK (name ~ '^[a-z][a-z0-9_]*$')
);

-- 创建数据结构表索引
CREATE INDEX IF NOT EXISTS idx_data_structures_code ON bdc.data_structures(code);
CREATE INDEX IF NOT EXISTS idx_data_structures_name ON bdc.data_structures(name);
CREATE INDEX IF NOT EXISTS idx_data_structures_is_active ON bdc.data_structures(is_active);

-- 创建迁移历史表
CREATE TABLE IF NOT EXISTS bdc.migrations_history (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 为表添加更新时间触发器
DROP TRIGGER IF EXISTS update_enums_updated_at ON bdc.enums;
CREATE TRIGGER update_enums_updated_at
    BEFORE UPDATE ON bdc.enums
    FOR EACH ROW
    EXECUTE FUNCTION bdc.update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_structures_updated_at ON bdc.data_structures;
CREATE TRIGGER update_data_structures_updated_at
    BEFORE UPDATE ON bdc.data_structures
    FOR EACH ROW
    EXECUTE FUNCTION bdc.update_updated_at_column();

-- 添加注释（移除category、parent_id、sort_order相关注释）
COMMENT ON TABLE bdc.database_connections IS '数据库连接配置表';
COMMENT ON COLUMN bdc.database_connections.id IS '连接ID（系统自动生成）';
COMMENT ON COLUMN bdc.database_connections.name IS '连接名称（唯一标识）';
COMMENT ON COLUMN bdc.database_connections.description IS '连接描述';
COMMENT ON COLUMN bdc.database_connections.type IS '数据库类型';
COMMENT ON COLUMN bdc.database_connections.host IS '主机地址';
COMMENT ON COLUMN bdc.database_connections.port IS '端口号';
COMMENT ON COLUMN bdc.database_connections.database IS '数据库名称';
COMMENT ON COLUMN bdc.database_connections.username IS '用户名';
COMMENT ON COLUMN bdc.database_connections.password IS '加密后的密码';
COMMENT ON COLUMN bdc.database_connections.schema IS 'Schema名称';
COMMENT ON COLUMN bdc.database_connections.sslConfig IS 'SSL配置（JSON格式）';
COMMENT ON COLUMN bdc.database_connections.poolConfig IS '连接池配置（JSON格式）';
COMMENT ON COLUMN bdc.database_connections.monitorConfig IS '监控配置（JSON格式）';
COMMENT ON COLUMN bdc.database_connections.status IS '连接状态';
COMMENT ON COLUMN bdc.database_connections.allowRemote IS '是否支持远程连接';
COMMENT ON COLUMN bdc.database_connections.allowedIps IS '允许的IP地址列表';
COMMENT ON COLUMN bdc.database_connections.lastTestAt IS '最后测试连接时间';
COMMENT ON COLUMN bdc.database_connections.lastTestSuccess IS '最后测试是否成功';
COMMENT ON COLUMN bdc.database_connections.lastTestError IS '最后测试错误信息';
COMMENT ON COLUMN bdc.database_connections.stats IS '连接统计信息（JSON格式）';
COMMENT ON COLUMN bdc.database_connections.is_active IS '是否激活';
COMMENT ON COLUMN bdc.database_connections.created_at IS '创建时间';
COMMENT ON COLUMN bdc.database_connections.updated_at IS '更新时间';

COMMENT ON TABLE bdc.enums IS '枚举定义表';
COMMENT ON COLUMN bdc.enums.id IS '枚举ID（系统自动生成）';
COMMENT ON COLUMN bdc.enums.code IS '枚举代码（唯一标识）';
COMMENT ON COLUMN bdc.enums.name IS '枚举名称';
COMMENT ON COLUMN bdc.enums.description IS '枚举描述';
COMMENT ON COLUMN bdc.enums.options IS '枚举选项列表（JSON格式）';
COMMENT ON COLUMN bdc.enums.is_multiple IS '是否支持多选';
COMMENT ON COLUMN bdc.enums.is_active IS '是否激活';
COMMENT ON COLUMN bdc.enums.created_at IS '创建时间';
COMMENT ON COLUMN bdc.enums.updated_at IS '更新时间';

COMMENT ON TABLE bdc.data_structures IS '数据结构定义表';
COMMENT ON COLUMN bdc.data_structures.id IS '数据结构ID';
COMMENT ON COLUMN bdc.data_structures.code IS '数据结构代码（唯一标识）';
COMMENT ON COLUMN bdc.data_structures.name IS '数据结构名称';
COMMENT ON COLUMN bdc.data_structures.fields IS '字段定义列表（JSON格式）';
COMMENT ON COLUMN bdc.data_structures.key_indexes IS '主键和索引信息（JSON格式）';
COMMENT ON COLUMN bdc.data_structures.physical_storage IS '物理存储信息（JSON格式）';
COMMENT ON COLUMN bdc.data_structures.validation_errors IS '验证错误信息（JSON格式）';
COMMENT ON COLUMN bdc.data_structures.description IS '数据结构描述';
COMMENT ON COLUMN bdc.data_structures.is_active IS '是否激活';
COMMENT ON COLUMN bdc.data_structures.version IS '版本号';
COMMENT ON COLUMN bdc.data_structures.created_at IS '创建时间';
COMMENT ON COLUMN bdc.data_structures.updated_at IS '更新时间';

COMMENT ON TABLE bdc.migrations_history IS '数据库迁移历史表';
COMMENT ON COLUMN bdc.migrations_history.id IS '迁移记录ID';
COMMENT ON COLUMN bdc.migrations_history.name IS '迁移名称';
COMMENT ON COLUMN bdc.migrations_history.timestamp IS '迁移执行时间';

-- 创建 API 定义表
CREATE TABLE IF NOT EXISTS bdc.api_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE')),
    path VARCHAR(255) NOT NULL,
    query_params JSONB,
    request_body JSONB,
    response_schema JSONB,
    data_source_id UUID NOT NULL REFERENCES bdc.database_connections(id),
    sql_query TEXT NOT NULL,
    sql_params JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT check_code_format CHECK (code ~ '^[a-zA-Z][a-zA-Z0-9_]*(:[a-zA-Z][a-zA-Z0-9_]*)*$'),
    CONSTRAINT check_name_format CHECK (name ~ '^[a-z][a-z0-9_]*$'),
    CONSTRAINT check_path_format CHECK (path ~ '^/[a-zA-Z0-9_/-]*$')
);

-- 创建 API 定义表索引
CREATE INDEX IF NOT EXISTS idx_api_definitions_code ON bdc.api_definitions(code);
CREATE INDEX IF NOT EXISTS idx_api_definitions_name ON bdc.api_definitions(name);
CREATE INDEX IF NOT EXISTS idx_api_definitions_path ON bdc.api_definitions(path);
CREATE INDEX IF NOT EXISTS idx_api_definitions_is_active ON bdc.api_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_api_definitions_data_source_id ON bdc.api_definitions(data_source_id);

-- 为 API 定义表添加更新时间触发器
DROP TRIGGER IF EXISTS update_api_definitions_updated_at ON bdc.api_definitions;
CREATE TRIGGER update_api_definitions_updated_at
    BEFORE UPDATE ON bdc.api_definitions
    FOR EACH ROW
    EXECUTE FUNCTION bdc.update_updated_at_column();

-- 添加 API 定义表注释
COMMENT ON TABLE bdc.api_definitions IS 'API 定义表';
COMMENT ON COLUMN bdc.api_definitions.id IS 'API 定义 ID';
COMMENT ON COLUMN bdc.api_definitions.code IS 'API 代码（唯一标识）';
COMMENT ON COLUMN bdc.api_definitions.name IS 'API 名称';
COMMENT ON COLUMN bdc.api_definitions.description IS 'API 描述';
COMMENT ON COLUMN bdc.api_definitions.method IS 'HTTP 方法';
COMMENT ON COLUMN bdc.api_definitions.path IS 'API 路径';
COMMENT ON COLUMN bdc.api_definitions.query_params IS '查询参数定义（JSON格式）';
COMMENT ON COLUMN bdc.api_definitions.request_body IS '请求体定义（JSON格式）';
COMMENT ON COLUMN bdc.api_definitions.response_schema IS '响应模式定义（JSON格式）';
COMMENT ON COLUMN bdc.api_definitions.data_source_id IS '关联的数据源 ID';
COMMENT ON COLUMN bdc.api_definitions.sql_query IS 'SQL 查询语句';
COMMENT ON COLUMN bdc.api_definitions.sql_params IS 'SQL 参数定义（JSON格式）';
COMMENT ON COLUMN bdc.api_definitions.is_active IS '是否激活';
COMMENT ON COLUMN bdc.api_definitions.created_at IS '创建时间';
COMMENT ON COLUMN bdc.api_definitions.updated_at IS '更新时间';
COMMENT ON COLUMN bdc.api_definitions.created_by IS '创建人';
COMMENT ON COLUMN bdc.api_definitions.updated_by IS '更新人';