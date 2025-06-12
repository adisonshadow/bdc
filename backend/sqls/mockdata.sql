-- 清空现有数据
TRUNCATE TABLE bdc.enums CASCADE;
TRUNCATE TABLE bdc.data_structures CASCADE;

-- 插入系统基础枚举（移除category、sort_order字段）
INSERT INTO bdc.enums (code, name, options, description, is_active, is_multiple) VALUES
-- 系统状态枚举
('system:common:status', 'system_status', '[
    {"key": "active", "value": "启用", "description": "正常使用状态", "sortOrder": 1, "isActive": true},
    {"key": "inactive", "value": "禁用", "description": "停用状态", "sortOrder": 2, "isActive": true}
]'::jsonb, '系统通用状态', true, false),

-- 系统是否枚举
('system:common:yesno', 'system_yesno', '[
    {"key": "yes", "value": "是", "description": "是", "sortOrder": 1, "isActive": true},
    {"key": "no", "value": "否", "description": "否", "sortOrder": 2, "isActive": true}
]'::jsonb, '系统是否选项', true, false);

-- 插入生产管理相关枚举（移除category、sort_order字段）
INSERT INTO bdc.enums (code, name, options, description, is_active, is_multiple) VALUES
-- 计划状态枚举
('production:plan:status', 'plan_status', '[
    {"key": "draft", "value": "草稿", "description": "计划处于草稿状态", "sortOrder": 1, "isActive": true},
    {"key": "pending", "value": "待审核", "description": "计划等待审核", "sortOrder": 2, "isActive": true},
    {"key": "approved", "value": "已审核", "description": "计划已通过审核", "sortOrder": 3, "isActive": true},
    {"key": "in_progress", "value": "执行中", "description": "计划正在执行", "sortOrder": 4, "isActive": true},
    {"key": "completed", "value": "已完成", "description": "计划执行完成", "sortOrder": 5, "isActive": true},
    {"key": "cancelled", "value": "已取消", "description": "计划已取消", "sortOrder": 6, "isActive": true}
]'::jsonb, '生产计划状态', true, false);

-- 生产类型枚举
INSERT INTO bdc.enums (code, name, options, description, is_active, is_multiple) VALUES
('production:plan:type', 'plan_type', '[
    {"key": "normal", "value": "常规生产", "description": "常规生产计划", "sortOrder": 1, "isActive": true},
    {"key": "urgent", "value": "紧急生产", "description": "紧急生产计划", "sortOrder": 2, "isActive": true},
    {"key": "trial", "value": "试产", "description": "试产计划", "sortOrder": 3, "isActive": true},
    {"key": "sample", "value": "样品生产", "description": "样品生产计划", "sortOrder": 4, "isActive": true}
]'::jsonb, '生产计划类型', true, false);

-- 生产线状态枚举
INSERT INTO bdc.enums (code, name, options, description, is_active, is_multiple) VALUES
('production:line:status', 'line_status', '[
    {"key": "idle", "value": "空闲", "description": "生产线空闲", "sortOrder": 1, "isActive": true},
    {"key": "running", "value": "运行中", "description": "生产线正在运行", "sortOrder": 2, "isActive": true},
    {"key": "maintenance", "value": "维护中", "description": "生产线正在维护", "sortOrder": 3, "isActive": true},
    {"key": "fault", "value": "故障", "description": "生产线发生故障", "sortOrder": 4, "isActive": true},
    {"key": "shutdown", "value": "停机", "description": "生产线停机", "sortOrder": 5, "isActive": true}
]'::jsonb, '生产线状态', true, false);

-- 设备状态枚举
INSERT INTO bdc.enums (code, name, options, description, is_active, is_multiple) VALUES
('equipment:device:status', 'device_status', '[
    {"key": "normal", "value": "正常", "description": "设备运行正常", "sortOrder": 1, "isActive": true},
    {"key": "warning", "value": "警告", "description": "设备需要关注", "sortOrder": 2, "isActive": true},
    {"key": "fault", "value": "故障", "description": "设备发生故障", "sortOrder": 3, "isActive": true},
    {"key": "maintenance", "value": "维护中", "description": "设备正在维护", "sortOrder": 4, "isActive": true},
    {"key": "shutdown", "value": "停机", "description": "设备已停机", "sortOrder": 5, "isActive": true}
]'::jsonb, '设备状态', true, false);

-- 设备类型枚举
INSERT INTO bdc.enums (code, name, options, description, is_active, is_multiple) VALUES
('equipment:device:type', 'device_type', '[
    {"key": "production", "value": "生产设备", "description": "用于生产的主要设备", "sortOrder": 1, "isActive": true},
    {"key": "testing", "value": "检测设备", "description": "用于质量检测的设备", "sortOrder": 2, "isActive": true},
    {"key": "auxiliary", "value": "辅助设备", "description": "辅助生产的设备", "sortOrder": 3, "isActive": true}
]'::jsonb, '设备类型', true, false);

-- 物料类型枚举
INSERT INTO bdc.enums (code, name, options, description, is_active, is_multiple) VALUES
('material:type', 'material_type', '[
    {"key": "raw", "value": "原材料", "description": "生产用原材料", "sortOrder": 1, "isActive": true},
    {"key": "semi", "value": "半成品", "description": "生产过程中的半成品", "sortOrder": 2, "isActive": true},
    {"key": "finished", "value": "成品", "description": "最终成品", "sortOrder": 3, "isActive": true},
    {"key": "auxiliary", "value": "辅料", "description": "生产用辅助材料", "sortOrder": 4, "isActive": true}
]'::jsonb, '物料类型', true, false);

-- 物料单位枚举
INSERT INTO bdc.enums (code, name, options, description, is_active, is_multiple) VALUES
('material:unit', 'material_unit', '[
    {"key": "piece", "value": "件", "description": "计件单位", "sortOrder": 1, "isActive": true},
    {"key": "kg", "value": "千克", "description": "重量单位", "sortOrder": 2, "isActive": true},
    {"key": "m", "value": "米", "description": "长度单位", "sortOrder": 3, "isActive": true},
    {"key": "m2", "value": "平方米", "description": "面积单位", "sortOrder": 4, "isActive": true},
    {"key": "m3", "value": "立方米", "description": "体积单位", "sortOrder": 5, "isActive": true}
]'::jsonb, '物料单位', true, false);

-- 质量等级枚举
INSERT INTO bdc.enums (code, name, options, description, is_active, is_multiple) VALUES
('quality:grade', 'quality_grade', '[
    {"key": "excellent", "value": "优等品", "description": "质量等级优等", "sortOrder": 1, "isActive": true},
    {"key": "good", "value": "良等品", "description": "质量等级良等", "sortOrder": 2, "isActive": true},
    {"key": "qualified", "value": "合格品", "description": "质量等级合格", "sortOrder": 3, "isActive": true},
    {"key": "defective", "value": "不良品", "description": "质量不合格", "sortOrder": 4, "isActive": true}
]'::jsonb, '质量等级', true, false);

-- 质检类型枚举
INSERT INTO bdc.enums (code, name, options, description, is_active, is_multiple) VALUES
('quality:check:type', 'check_type', '[
    {"key": "incoming", "value": "来料检验", "description": "原材料入厂检验", "sortOrder": 1, "isActive": true},
    {"key": "process", "value": "过程检验", "description": "生产过程检验", "sortOrder": 2, "isActive": true},
    {"key": "final", "value": "成品检验", "description": "成品出厂检验", "sortOrder": 3, "isActive": true}
]'::jsonb, '质检类型', true, false);

-- 插入生产管理相关数据结构
INSERT INTO bdc.data_structures (code, name, fields, description, is_active, version) VALUES
-- 生产计划数据结构
('production:plan', '生产计划', '[
    {
        "id": "f8d7e6c5-b4a3-2c1d-9e8f-7a6b5c4d3e2f",
        "name": "plan_code",
        "type": "string",
        "required": true,
        "description": "计划编号",
        "length": 12,
        "isPrimaryKey": true
    },
    {
        "id": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
        "name": "plan_type",
        "type": "enum",
        "required": true,
        "description": "计划类型",
        "enumConfig": {
            "enumId": "production:plan:type",
            "multiple": false
        }
    },
    {
        "id": "b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7",
        "name": "product_code",
        "type": "string",
        "required": true,
        "description": "产品编号"
    },
    {
        "id": "c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8",
        "name": "product_name",
        "type": "string",
        "required": true,
        "description": "产品名称"
    },
    {
        "id": "d4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9",
        "name": "planned_quantity",
        "type": "number",
        "required": true,
        "description": "计划数量"
    },
    {
        "id": "e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0",
        "name": "start_date",
        "type": "date",
        "required": true,
        "description": "计划开始日期",
        "dateType": "date"
    },
    {
        "id": "f6g7h8i9-j0k1-l2m3-n4o5-p6q7r8s9t0u1",
        "name": "end_date",
        "type": "date",
        "required": true,
        "description": "计划结束日期",
        "dateType": "date"
    },
    {
        "id": "g7h8i9j0-k1l2-m3n4-o5p6-q7r8s9t0u1v2",
        "name": "status",
        "type": "enum",
        "required": true,
        "description": "计划状态",
        "enumConfig": {
            "enumId": "production:plan:status",
            "multiple": false
        }
    },
    {
        "id": "h8i9j0k1-l2m3-n4o5-p6q7-r8s9t0u1v2w3",
        "name": "priority",
        "type": "number",
        "required": true,
        "description": "优先级"
    },
    {
        "id": "i9j0k1l2-m3n4-o5p6-q7r8-s9t0u1v2w3x4",
        "name": "remark",
        "type": "text",
        "required": false,
        "description": "备注"
    }
]'::jsonb, '生产计划主数据结构', true, 1),

-- 生产线数据结构
('production:line', '生产线', '[
    {
        "id": "j0k1l2m3-n4o5-p6q7-r8s9-t0u1v2w3x4y5",
        "name": "line_code",
        "type": "string",
        "required": true,
        "description": "生产线编号",
        "isPrimaryKey": true,
        "length": 4
    },
    {
        "id": "k1l2m3n4-o5p6-q7r8-s9t0-u1v2w3x4y5z6",
        "name": "line_name",
        "type": "string",
        "required": true,
        "description": "生产线名称"
    },
    {
        "id": "l2m3n4o5-p6q7-r8s9-t0u1-v2w3x4y5z6a7",
        "name": "status",
        "type": "enum",
        "required": true,
        "description": "生产线状态",
        "enumConfig": {
            "enumId": "production:line:status",
            "multiple": false
        }
    },
    {
        "id": "m3n4o5p6-q7r8-s9t0-u1v2-w3x4y5z6a7b8",
        "name": "capacity",
        "type": "number",
        "required": true,
        "description": "日产能"
    },
    {
        "id": "n4o5p6q7-r8s9-t0u1-v2w3-x4y5z6a7b8c9",
        "name": "manager",
        "type": "string",
        "required": true,
        "description": "生产线负责人"
    },
    {
        "id": "o5p6q7r8-s9t0-u1v2-w3x4-y5z6a7b8c9d0",
        "name": "last_maintenance_date",
        "type": "date",
        "required": false,
        "description": "最后维护日期",
        "dateType": "date"
    },
    {
        "id": "p6q7r8s9-t0u1-v2w3-x4y5-z6a7b8c9d0e1",
        "name": "remark",
        "type": "text",
        "required": false,
        "description": "备注"
    }
]'::jsonb, '生产线数据结构', true, 1),

-- 生产工单数据结构
('production:work_order', '生产工单', '[
    {
        "id": "q7r8s9t0-u1v2-w3x4-y5z6-a7b8c9d0e1f2",
        "name": "work_order_code",
        "type": "string",
        "required": true,
        "description": "工单编号",
        "isPrimaryKey": true,
        "length": 12
    },
    {
        "id": "r8s9t0u1-v2w3-x4y5-z6a7-b8c9d0e1f2g3",
        "name": "plan_code",
        "type": "string",
        "required": true,
        "description": "关联计划编号"
    },
    {
        "id": "s9t0u1v2-w3x4-y5z6-a7b8-c9d0e1f2g3h4",
        "name": "line_code",
        "type": "string",
        "required": true,
        "description": "生产线编号"
    },
    {
        "id": "t0u1v2w3-x4y5-z6a7-b8c9-d0e1f2g3h4i5",
        "name": "product_code",
        "type": "string",
        "required": true,
        "description": "产品编号"
    },
    {
        "id": "u1v2w3x4-y5z6-a7b8-c9d0-e1f2g3h4i5j6",
        "name": "product_name",
        "type": "string",
        "required": true,
        "description": "产品名称"
    },
    {
        "id": "v2w3x4y5-z6a7-b8c9-d0e1-f2g3h4i5j6k7",
        "name": "quantity",
        "type": "number",
        "required": true,
        "description": "生产数量"
    },
    {
        "id": "w3x4y5z6-a7b8-c9d0-e1f2-g3h4i5j6k7l8",
        "name": "status",
        "type": "enum",
        "required": true,
        "description": "工单状态",
        "enumConfig": {
            "enumId": "production:plan:status",
            "multiple": false
        }
    },
    {
        "id": "x4y5z6a7-b8c9-d0e1-f2g3-h4i5j6k7l8m9",
        "name": "quality_grade",
        "type": "enum",
        "required": false,
        "description": "质量等级",
        "enumConfig": {
            "enumId": "quality:grade",
            "multiple": false
        }
    },
    {
        "id": "y5z6a7b8-c9d0-e1f2-g3h4-i5j6k7l8m9n0",
        "name": "start_time",
        "type": "date",
        "required": true,
        "description": "开始时间",
        "dateType": "datetime"
    },
    {
        "id": "z6a7b8c9-d0e1-f2g3-h4i5-j6k7l8m9n0o1",
        "name": "end_time",
        "type": "date",
        "required": false,
        "description": "结束时间",
        "dateType": "datetime"
    },
    {
        "id": "a7b8c9d0-e1f2-g3h4-i5j6-k7l8m9n0o1p2",
        "name": "remark",
        "type": "text",
        "required": false,
        "description": "备注"
    }
]'::jsonb, '生产工单数据结构', true, 1);

-- 插入设备管理数据结构
INSERT INTO bdc.data_structures (code, name, fields, description, is_active, version)
VALUES (
  'equipment:device',
  '设备',
  '[
    {
        "id": "c1d2e3f4-g5h6-i7j8-k9l0-m1n2o3p4q5r6",
        "name": "device_code",
        "type": "string",
        "required": true,
        "description": "设备编号",
        "isPrimaryKey": true
    },
    {
        "id": "d2e3f4g5-h6i7-j8k9-l0m1-n2o3p4q5r6s7",
        "name": "device_name",
        "type": "string",
        "required": true,
        "description": "设备名称"
    },
    {
        "id": "e3f4g5h6-i7j8-k9l0-m1n2-o3p4q5r6s7t8",
        "name": "device_type",
        "type": "string",
        "required": true,
        "description": "设备类型"
    },
    {
        "id": "f4g5h6i7-j8k9-l0m1-n2o3-p4q5r6s7t8u9",
        "name": "manufacturer",
        "type": "string",
        "required": true,
        "description": "制造商"
    },
    {
        "id": "g5h6i7j8-k9l0-m1n2-o3p4-q5r6s7t8u9v0",
        "name": "purchase_date",
        "type": "date",
        "required": true,
        "description": "购买日期",
        "dateType": "date"
    },
    {
        "id": "h6i7j8k9-l0m1-n2o3-p4q5-r6s7t8u9v0w1",
        "name": "status",
        "type": "enum",
        "required": true,
        "description": "设备状态",
        "enumConfig": {
            "enumId": "device:status",
            "multiple": false
        }
    },
    {
        "id": "i7j8k9l0-m1n2-o3p4-q5r6-s7t8u9v0w1x2",
        "name": "last_maintenance_date",
        "type": "date",
        "required": false,
        "description": "最后维护日期",
        "dateType": "date"
    }
]'::jsonb,
  '设备管理数据结构',
  true,
  1
);

-- 插入原材料管理数据结构
INSERT INTO bdc.data_structures (code, name, fields, description, is_active, version)
VALUES (
  'material:raw',
  '原材料',
  '[
    {
        "id": "j8k9l0m1-n2o3-p4q5-r6s7-t8u9v0w1x2y3",
        "name": "material_code",
        "type": "string",
        "required": true,
        "description": "材料编号",
        "isPrimaryKey": true
    },
    {
        "id": "k9l0m1n2-o3p4-q5r6-s7t8-u9v0w1x2y3z4",
        "name": "material_name",
        "type": "string",
        "required": true,
        "description": "材料名称"
    },
    {
        "id": "l0m1n2o3-p4q5-r6s7-t8u9-v0w1x2y3z4a5",
        "name": "specification",
        "type": "string",
        "required": true,
        "description": "规格型号"
    },
    {
        "id": "m1n2o3p4-q5r6-s7t8-u9v0-w1x2y3z4a5b6",
        "name": "unit",
        "type": "string",
        "required": true,
        "description": "计量单位"
    },
    {
        "id": "n2o3p4q5-r6s7-t8u9-v0w1-x2y3z4a5b6c7",
        "name": "current_stock",
        "type": "number",
        "required": true,
        "description": "当前库存"
    },
    {
        "id": "o3p4q5r6-s7t8-t9u0-v1w2-x3y4z5a6b7c8",
        "name": "min_stock",
        "type": "number",
        "required": true,
        "description": "最低库存"
    },
    {
        "id": "p4q5r6s7-t8u9-v0w1-x2y3-z4a5b6c7d8e9",
        "name": "max_stock",
        "type": "number",
        "required": true,
        "description": "最高库存"
    },
    {
        "id": "q5r6s7t8-u9v0-w1x2-y3z4-a5b6c7d8e9f0",
        "name": "supplier",
        "type": "string",
        "required": true,
        "description": "供应商"
    }
]'::jsonb,
  '原材料管理数据结构',
  true,
  1
);