-- 为 ai_configs 表添加 auth_header 字段
-- 迁移脚本：添加认证头字段

-- 添加 auth_header 字段
ALTER TABLE bdc.ai_configs 
ADD COLUMN IF NOT EXISTS auth_header VARCHAR(100);

-- 添加注释
COMMENT ON COLUMN bdc.ai_configs.auth_header IS '认证头名称（如：Authorization, X-goog-api-key等）';

-- 更新现有记录的认证头（默认为Authorization）
UPDATE bdc.ai_configs 
SET auth_header = 'Authorization' 
WHERE auth_header IS NULL; 