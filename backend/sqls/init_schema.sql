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

-- 创建枚举表
CREATE TABLE IF NOT EXISTS bdc.enums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
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
    description TEXT,
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
COMMENT ON COLUMN bdc.data_structures.description IS '数据结构描述';
COMMENT ON COLUMN bdc.data_structures.is_active IS '是否激活';
COMMENT ON COLUMN bdc.data_structures.version IS '版本号';
COMMENT ON COLUMN bdc.data_structures.created_at IS '创建时间';
COMMENT ON COLUMN bdc.data_structures.updated_at IS '更新时间';

COMMENT ON TABLE bdc.migrations_history IS '数据库迁移历史表';
COMMENT ON COLUMN bdc.migrations_history.id IS '迁移记录ID';
COMMENT ON COLUMN bdc.migrations_history.name IS '迁移名称';
COMMENT ON COLUMN bdc.migrations_history.timestamp IS '迁移执行时间';