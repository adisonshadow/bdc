-- 清空现有数据
TRUNCATE TABLE bdc.enums CASCADE;
TRUNCATE TABLE bdc.data_structures CASCADE;

-- 插入系统基础枚举（使用多级code结构）
INSERT INTO bdc.enums (code, name, options, description, is_active, is_multiple) VALUES
-- 系统通用状态枚举
('system:common:status', 'system_common_status', '[
    {"key": "active", "value": "启用", "description": "正常使用状态", "sortOrder": 1, "isActive": true},
    {"key": "inactive", "value": "禁用", "description": "停用状态", "sortOrder": 2, "isActive": true},
    {"key": "deleted", "value": "已删除", "description": "已删除状态", "sortOrder": 3, "isActive": true}
]'::jsonb, '系统通用状态', true, false),

-- 系统是否枚举
('system:common:yesno', 'system_common_yesno', '[
    {"key": "yes", "value": "是", "description": "是", "sortOrder": 1, "isActive": true},
    {"key": "no", "value": "否", "description": "否", "sortOrder": 2, "isActive": true}
]'::jsonb, '系统是否选项', true, false),

-- 系统优先级枚举
('system:common:priority', 'system_common_priority', '[
    {"key": "low", "value": "低", "description": "低优先级", "sortOrder": 1, "isActive": true},
    {"key": "normal", "value": "普通", "description": "普通优先级", "sortOrder": 2, "isActive": true},
    {"key": "high", "value": "高", "description": "高优先级", "sortOrder": 3, "isActive": true},
    {"key": "urgent", "value": "紧急", "description": "紧急优先级", "sortOrder": 4, "isActive": true}
]'::jsonb, '系统优先级', true, false);

-- 插入生产管理相关枚举
INSERT INTO bdc.enums (code, name, options, description, is_active, is_multiple) VALUES
-- 生产计划状态枚举
('production:plan:status', 'production_plan_status', '[
    {"key": "draft", "value": "草稿", "description": "计划处于草稿状态", "sortOrder": 1, "isActive": true},
    {"key": "pending", "value": "待审核", "description": "计划等待审核", "sortOrder": 2, "isActive": true},
    {"key": "approved", "value": "已审核", "description": "计划已通过审核", "sortOrder": 3, "isActive": true},
    {"key": "in_progress", "value": "执行中", "description": "计划正在执行", "sortOrder": 4, "isActive": true},
    {"key": "completed", "value": "已完成", "description": "计划执行完成", "sortOrder": 5, "isActive": true},
    {"key": "cancelled", "value": "已取消", "description": "计划已取消", "sortOrder": 6, "isActive": true}
]'::jsonb, '生产计划状态', true, false),

-- 生产计划类型枚举
('production:plan:type', 'production_plan_type', '[
    {"key": "normal", "value": "常规生产", "description": "常规生产计划", "sortOrder": 1, "isActive": true},
    {"key": "urgent", "value": "紧急生产", "description": "紧急生产计划", "sortOrder": 2, "isActive": true},
    {"key": "trial", "value": "试产", "description": "试产计划", "sortOrder": 3, "isActive": true},
    {"key": "sample", "value": "样品生产", "description": "样品生产计划", "sortOrder": 4, "isActive": true}
]'::jsonb, '生产计划类型', true, false),

-- 生产线状态枚举
('production:line:status', 'production_line_status', '[
    {"key": "idle", "value": "空闲", "description": "生产线空闲", "sortOrder": 1, "isActive": true},
    {"key": "running", "value": "运行中", "description": "生产线正在运行", "sortOrder": 2, "isActive": true},
    {"key": "maintenance", "value": "维护中", "description": "生产线正在维护", "sortOrder": 3, "isActive": true},
    {"key": "fault", "value": "故障", "description": "生产线发生故障", "sortOrder": 4, "isActive": true},
    {"key": "shutdown", "value": "停机", "description": "生产线停机", "sortOrder": 5, "isActive": true}
]'::jsonb, '生产线状态', true, false),

-- 生产线类型枚举
('production:line:type', 'production_line_type', '[
    {"key": "assembly", "value": "装配线", "description": "产品装配生产线", "sortOrder": 1, "isActive": true},
    {"key": "packaging", "value": "包装线", "description": "产品包装生产线", "sortOrder": 2, "isActive": true},
    {"key": "testing", "value": "测试线", "description": "产品测试生产线", "sortOrder": 3, "isActive": true},
    {"key": "inspection", "value": "检验线", "description": "产品检验生产线", "sortOrder": 4, "isActive": true}
]'::jsonb, '生产线类型', true, false),

-- 工单状态枚举
('production:workorder:status', 'production_workorder_status', '[
    {"key": "created", "value": "已创建", "description": "工单已创建", "sortOrder": 1, "isActive": true},
    {"key": "assigned", "value": "已分配", "description": "工单已分配给生产线", "sortOrder": 2, "isActive": true},
    {"key": "in_progress", "value": "进行中", "description": "工单正在执行", "sortOrder": 3, "isActive": true},
    {"key": "paused", "value": "暂停", "description": "工单暂停执行", "sortOrder": 4, "isActive": true},
    {"key": "completed", "value": "已完成", "description": "工单执行完成", "sortOrder": 5, "isActive": true},
    {"key": "cancelled", "value": "已取消", "description": "工单已取消", "sortOrder": 6, "isActive": true}
]'::jsonb, '工单状态', true, false),

-- 设备状态枚举
('equipment:device:status', 'equipment_device_status', '[
    {"key": "normal", "value": "正常", "description": "设备运行正常", "sortOrder": 1, "isActive": true},
    {"key": "warning", "value": "警告", "description": "设备需要关注", "sortOrder": 2, "isActive": true},
    {"key": "fault", "value": "故障", "description": "设备发生故障", "sortOrder": 3, "isActive": true},
    {"key": "maintenance", "value": "维护中", "description": "设备正在维护", "sortOrder": 4, "isActive": true},
    {"key": "shutdown", "value": "停机", "description": "设备已停机", "sortOrder": 5, "isActive": true}
]'::jsonb, '设备状态', true, false),

-- 设备类型枚举
('equipment:device:type', 'equipment_device_type', '[
    {"key": "production", "value": "生产设备", "description": "用于生产的主要设备", "sortOrder": 1, "isActive": true},
    {"key": "testing", "value": "检测设备", "description": "用于质量检测的设备", "sortOrder": 2, "isActive": true},
    {"key": "auxiliary", "value": "辅助设备", "description": "辅助生产的设备", "sortOrder": 3, "isActive": true},
    {"key": "safety", "value": "安全设备", "description": "安全防护设备", "sortOrder": 4, "isActive": true}
]'::jsonb, '设备类型', true, false),

-- 物料类型枚举
('material:type', 'material_type', '[
    {"key": "raw", "value": "原材料", "description": "生产用原材料", "sortOrder": 1, "isActive": true},
    {"key": "semi", "value": "半成品", "description": "生产过程中的半成品", "sortOrder": 2, "isActive": true},
    {"key": "finished", "value": "成品", "description": "最终成品", "sortOrder": 3, "isActive": true},
    {"key": "auxiliary", "value": "辅料", "description": "生产用辅助材料", "sortOrder": 4, "isActive": true},
    {"key": "packaging", "value": "包装材料", "description": "产品包装材料", "sortOrder": 5, "isActive": true}
]'::jsonb, '物料类型', true, false),

-- 物料单位枚举
('material:unit', 'material_unit', '[
    {"key": "piece", "value": "件", "description": "计件单位", "sortOrder": 1, "isActive": true},
    {"key": "kg", "value": "千克", "description": "重量单位", "sortOrder": 2, "isActive": true},
    {"key": "m", "value": "米", "description": "长度单位", "sortOrder": 3, "isActive": true},
    {"key": "m2", "value": "平方米", "description": "面积单位", "sortOrder": 4, "isActive": true},
    {"key": "m3", "value": "立方米", "description": "体积单位", "sortOrder": 5, "isActive": true},
    {"key": "l", "value": "升", "description": "容积单位", "sortOrder": 6, "isActive": true}
]'::jsonb, '物料单位', true, false),

-- 质量等级枚举
('quality:grade', 'quality_grade', '[
    {"key": "excellent", "value": "优等品", "description": "质量等级优等", "sortOrder": 1, "isActive": true},
    {"key": "good", "value": "良等品", "description": "质量等级良等", "sortOrder": 2, "isActive": true},
    {"key": "qualified", "value": "合格品", "description": "质量等级合格", "sortOrder": 3, "isActive": true},
    {"key": "defective", "value": "不良品", "description": "质量不合格", "sortOrder": 4, "isActive": true}
]'::jsonb, '质量等级', true, false),

-- 质检类型枚举
('quality:check:type', 'quality_check_type', '[
    {"key": "incoming", "value": "来料检验", "description": "原材料入厂检验", "sortOrder": 1, "isActive": true},
    {"key": "process", "value": "过程检验", "description": "生产过程检验", "sortOrder": 2, "isActive": true},
    {"key": "final", "value": "成品检验", "description": "成品出厂检验", "sortOrder": 3, "isActive": true},
    {"key": "sampling", "value": "抽样检验", "description": "抽样质量检验", "sortOrder": 4, "isActive": true}
]'::jsonb, '质检类型', true, false),

-- 质检结果枚举
('quality:check:result', 'quality_check_result', '[
    {"key": "pass", "value": "合格", "description": "检验合格", "sortOrder": 1, "isActive": true},
    {"key": "fail", "value": "不合格", "description": "检验不合格", "sortOrder": 2, "isActive": true},
    {"key": "conditional", "value": "有条件合格", "description": "有条件通过", "sortOrder": 3, "isActive": true}
]'::jsonb, '质检结果', true, false),

-- 供应商类型枚举
('supplier:type', 'supplier_type', '[
    {"key": "manufacturer", "value": "制造商", "description": "产品制造商", "sortOrder": 1, "isActive": true},
    {"key": "distributor", "value": "经销商", "description": "产品经销商", "sortOrder": 2, "isActive": true},
    {"key": "service", "value": "服务商", "description": "服务提供商", "sortOrder": 3, "isActive": true},
    {"key": "logistics", "value": "物流商", "description": "物流服务商", "sortOrder": 4, "isActive": true}
]'::jsonb, '供应商类型', true, false),

-- 供应商等级枚举
('supplier:level', 'supplier_level', '[
    {"key": "a", "value": "A级", "description": "A级供应商", "sortOrder": 1, "isActive": true},
    {"key": "b", "value": "B级", "description": "B级供应商", "sortOrder": 2, "isActive": true},
    {"key": "c", "value": "C级", "description": "C级供应商", "sortOrder": 3, "isActive": true},
    {"key": "d", "value": "D级", "description": "D级供应商", "sortOrder": 4, "isActive": true}
]'::jsonb, '供应商等级', true, false);

-- 插入生产管理相关数据结构
INSERT INTO bdc.data_structures (code, name, fields, description, is_active, is_locked, version) VALUES
-- 1. 生产计划数据结构
('production:plan', 'production_plan', '[
    {
        "id": "f8d7e6c5-b4a3-2c1d-9e8f-7a6b5c4d3e2f",
        "name": "plan_code",
        "type": "uuid",
        "required": true,
        "description": "计划编号",
        "isPrimaryKey": true
    },
    {
        "id": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
        "name": "plan_type",
        "type": "enum",
        "required": true,
        "description": "计划类型",
        "enumConfig": {
            "targetEnumCode": "production:plan:type",
            "multiple": false
        }
    },
    {
        "id": "b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7",
        "name": "product_code",
        "type": "relation",
        "required": true,
        "description": "产品编号",
        "relationConfig": {
            "targetSchemaCode": "production:product",
            "targetField": "product_code"
        }
    },
    {
        "id": "c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8",
        "name": "planned_quantity",
        "type": "number",
        "required": true,
        "description": "计划数量"
    },
    {
        "id": "d4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9",
        "name": "start_date",
        "type": "date",
        "required": true,
        "description": "计划开始日期",
        "dateType": "date"
    },
    {
        "id": "e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0",
        "name": "end_date",
        "type": "date",
        "required": true,
        "description": "计划结束日期",
        "dateType": "date"
    },
    {
        "id": "f6g7h8i9-j0k1-l2m3-n4o5-p6q7r8s9t0u1",
        "name": "status",
        "type": "enum",
        "required": true,
        "description": "计划状态",
        "enumConfig": {
            "targetEnumCode": "production:plan:status",
            "multiple": false
        }
    },
    {
        "id": "g7h8i9j0-k1l2-m3n4-o5p6-q7r8s9t0u1v2",
        "name": "priority",
        "type": "enum",
        "required": true,
        "description": "优先级",
        "enumConfig": {
            "targetEnumCode": "system:common:priority",
            "multiple": false
        }
    },
    {
        "id": "h8i9j0k1-l2m3-n4o5-p6q7-r8s9t0u1v2w3",
        "name": "remark",
        "type": "text",
        "required": false,
        "description": "备注"
    }
]'::jsonb, '生产计划主数据结构', true, false, 1),

-- 2. 产品数据结构
('production:product', 'production_product', '[
    {
        "id": "i9j0k1l2-m3n4-o5p6-q7r8-s9t0u1v2w3x4",
        "name": "product_code",
        "type": "uuid",
        "required": true,
        "description": "产品编号",
        "isPrimaryKey": true
    },
    {
        "id": "j0k1l2m3-n4o5-p6q7-r8s9-t0u1v2w3x4y5",
        "name": "product_name",
        "type": "string",
        "required": true,
        "description": "产品名称"
    },
    {
        "id": "k1l2m3n4-o5p6-q7r8-s9t0-u1v2w3x4y5z6",
        "name": "product_type",
        "type": "string",
        "required": true,
        "description": "产品类型"
    },
    {
        "id": "l2m3n4o5-p6q7-r8s9-t0u1-v2w3x4y5z6a7",
        "name": "specification",
        "type": "text",
        "required": false,
        "description": "产品规格"
    },
    {
        "id": "m3n4o5p6-q7r8-s9t0-u1v2-w3x4y5z6a7b8",
        "name": "unit",
        "type": "enum",
        "required": true,
        "description": "计量单位",
        "enumConfig": {
            "targetEnumCode": "material:unit",
            "multiple": false
        }
    },
    {
        "id": "n4o5p6q7-r8s9-t0u1-v2w3-x4y5z6a7b8c9",
        "name": "status",
        "type": "enum",
        "required": true,
        "description": "产品状态",
        "enumConfig": {
            "targetEnumCode": "system:common:status",
            "multiple": false
        }
    }
]'::jsonb, '产品数据结构', true, false, 1),

-- 3. 生产线数据结构
('production:line', 'production_line', '[
    {
        "id": "o5p6q7r8-s9t0-u1v2-w3x4-y5z6a7b8c9d0",
        "name": "line_code",
        "type": "uuid",
        "required": true,
        "description": "生产线编号",
        "isPrimaryKey": true
    },
    {
        "id": "p6q7r8s9-t0u1-v2w3-x4y5-z6a7b8c9d0e1",
        "name": "line_name",
        "type": "string",
        "required": true,
        "description": "生产线名称"
    },
    {
        "id": "q7r8s9t0-u1v2-w3x4-y5z6-a7b8c9d0e1f2",
        "name": "line_type",
        "type": "enum",
        "required": true,
        "description": "生产线类型",
        "enumConfig": {
            "targetEnumCode": "production:line:type",
            "multiple": false
        }
    },
    {
        "id": "r8s9t0u1-v2w3-x4y5-z6a7-b8c9d0e1f2g3",
        "name": "status",
        "type": "enum",
        "required": true,
        "description": "生产线状态",
        "enumConfig": {
            "targetEnumCode": "production:line:status",
            "multiple": false
        }
    },
    {
        "id": "s9t0u1v2-w3x4-y5z6-a7b8-c9d0e1f2g3h4",
        "name": "capacity",
        "type": "number",
        "required": true,
        "description": "日产能"
    },
    {
        "id": "t0u1v2w3-x4y5-z6a7-b8c9-d0e1f2g3h4i5",
        "name": "manager",
        "type": "string",
        "required": true,
        "description": "生产线负责人"
    },
    {
        "id": "u1v2w3x4-y5z6-a7b8-c9d0-e1f2g3h4i5j6",
        "name": "last_maintenance_date",
        "type": "date",
        "required": false,
        "description": "最后维护日期",
        "dateType": "date"
    }
]'::jsonb, '生产线数据结构', true, false, 1),

-- 4. 生产工单数据结构
('production:workorder', 'production_workorder', '[
    {
        "id": "v2w3x4y5-z6a7-b8c9-d0e1-f2g3h4i5j6k7",
        "name": "workorder_code",
        "type": "uuid",
        "required": true,
        "description": "工单编号",
        "isPrimaryKey": true
    },
    {
        "id": "w3x4y5z6-a7b8-c9d0-e1f2-g3h4i5j6k7l8",
        "name": "plan_code",
        "type": "relation",
        "required": true,
        "description": "关联计划编号",
        "relationConfig": {
            "targetSchemaCode": "production:plan",
            "targetField": "plan_code"
        }
    },
    {
        "id": "x4y5z6a7-b8c9-d0e1-f2g3-h4i5j6k7l8m9",
        "name": "line_code",
        "type": "relation",
        "required": true,
        "description": "生产线编号",
        "relationConfig": {
            "targetSchemaCode": "production:line",
            "targetField": "line_code"
        }
    },
    {
        "id": "y5z6a7b8-c9d0-e1f2-g3h4-i5j6k7l8m9n0",
        "name": "product_code",
        "type": "relation",
        "required": true,
        "description": "产品编号",
        "relationConfig": {
            "targetSchemaCode": "production:product",
            "targetField": "product_code"
        }
    },
    {
        "id": "z6a7b8c9-d0e1-f2g3-h4i5-j6k7l8m9n0o1",
        "name": "quantity",
        "type": "number",
        "required": true,
        "description": "生产数量"
    },
    {
        "id": "a7b8c9d0-e1f2-g3h4-i5j6-k7l8m9n0o1p2",
        "name": "status",
        "type": "enum",
        "required": true,
        "description": "工单状态",
        "enumConfig": {
            "targetEnumCode": "production:workorder:status",
            "multiple": false
        }
    },
    {
        "id": "b8c9d0e1-f2g3-h4i5-j6k7-l8m9n0o1p2q3",
        "name": "quality_grade",
        "type": "enum",
        "required": false,
        "description": "质量等级",
        "enumConfig": {
            "targetEnumCode": "quality:grade",
            "multiple": false
        }
    },
    {
        "id": "c9d0e1f2-g3h4-i5j6-k7l8-m9n0o1p2q3r4",
        "name": "start_time",
        "type": "date",
        "required": true,
        "description": "开始时间",
        "dateType": "datetime"
    },
    {
        "id": "d0e1f2g3-h4i5-j6k7-l8m9-n0o1p2q3r4s5",
        "name": "end_time",
        "type": "date",
        "required": false,
        "description": "结束时间",
        "dateType": "datetime"
    }
]'::jsonb, '生产工单数据结构', true, false, 1),

-- 5. 设备数据结构
('equipment:device', 'equipment_device', '[
    {
        "id": "e1f2g3h4-i5j6-k7l8-m9n0-o1p2q3r4s5t6",
        "name": "device_code",
        "type": "uuid",
        "required": true,
        "description": "设备编号",
        "isPrimaryKey": true
    },
    {
        "id": "f2g3h4i5-j6k7-l8m9-n0o1-p2q3r4s5t6u7",
        "name": "device_name",
        "type": "string",
        "required": true,
        "description": "设备名称"
    },
    {
        "id": "g3h4i5j6-k7l8-m9n0-o1p2-q3r4s5t6u7v8",
        "name": "device_type",
        "type": "enum",
        "required": true,
        "description": "设备类型",
        "enumConfig": {
            "targetEnumCode": "equipment:device:type",
            "multiple": false
        }
    },
    {
        "id": "h4i5j6k7-l8m9-n0o1-p2q3-r4s5t6u7v8w9",
        "name": "line_code",
        "type": "relation",
        "required": false,
        "description": "所属生产线",
        "relationConfig": {
            "targetSchemaCode": "production:line",
            "targetField": "line_code"
        }
    },
    {
        "id": "i5j6k7l8-m9n0-o1p2-q3r4-s5t6u7v8w9x0",
        "name": "manufacturer",
        "type": "string",
        "required": true,
        "description": "制造商"
    },
    {
        "id": "j6k7l8m9-n0o1-p2q3-r4s5-t6u7v8w9x0y1",
        "name": "model",
        "type": "string",
        "required": true,
        "description": "设备型号"
    },
    {
        "id": "k7l8m9n0-o1p2-q3r4-s5t6-u7v8w9x0y1z2",
        "name": "purchase_date",
        "type": "date",
        "required": true,
        "description": "购买日期",
        "dateType": "date"
    },
    {
        "id": "l8m9n0o1-p2q3-r4s5-t6u7-v8w9x0y1z2a3",
        "name": "status",
        "type": "enum",
        "required": true,
        "description": "设备状态",
        "enumConfig": {
            "targetEnumCode": "equipment:device:status",
            "multiple": false
        }
    },
    {
        "id": "m9n0o1p2-q3r4-s5t6-u7v8-w9x0y1z2a3b4",
        "name": "last_maintenance_date",
        "type": "date",
        "required": false,
        "description": "最后维护日期",
        "dateType": "date"
    }
]'::jsonb, '设备管理数据结构', true, false, 1),

-- 6. 物料数据结构
('material:item', 'material_item', '[
    {
        "id": "n0o1p2q3-r4s5-t6u7-v8w9-x0y1z2a3b4c5",
        "name": "material_code",
        "type": "uuid",
        "required": true,
        "description": "物料编号",
        "isPrimaryKey": true
    },
    {
        "id": "o1p2q3r4-s5t6-u7v8-w9x0-y1z2a3b4c5d6",
        "name": "material_name",
        "type": "string",
        "required": true,
        "description": "物料名称"
    },
    {
        "id": "p2q3r4s5-t6u7-v8w9-x0y1-z2a3b4c5d6e7",
        "name": "material_type",
        "type": "enum",
        "required": true,
        "description": "物料类型",
        "enumConfig": {
            "targetEnumCode": "material:type",
            "multiple": false
        }
    },
    {
        "id": "q3r4s5t6-u7v8-w9x0-y1z2-a3b4c5d6e7f8",
        "name": "specification",
        "type": "string",
        "required": true,
        "description": "规格型号"
    },
    {
        "id": "r4s5t6u7-v8w9-x0y1-z2a3-b4c5d6e7f8g9",
        "name": "unit",
        "type": "enum",
        "required": true,
        "description": "计量单位",
        "enumConfig": {
            "targetEnumCode": "material:unit",
            "multiple": false
        }
    },
    {
        "id": "s5t6u7v8-w9x0-y1z2-a3b4-c5d6e7f8g9h0",
        "name": "current_stock",
        "type": "number",
        "required": true,
        "description": "当前库存"
    },
    {
        "id": "t6u7v8w9-x0y1-z2a3-b4c5-d6e7f8g9h0i1",
        "name": "min_stock",
        "type": "number",
        "required": true,
        "description": "最低库存"
    },
    {
        "id": "u7v8w9x0-y1z2-a3b4-c5d6-e7f8g9h0i1j2",
        "name": "max_stock",
        "type": "number",
        "required": true,
        "description": "最高库存"
    },
    {
        "id": "v8w9x0y1-z2a3-b4c5-d6e7-f8g9h0i1j2k3",
        "name": "supplier_code",
        "type": "relation",
        "required": true,
        "description": "供应商编号",
        "relationConfig": {
            "targetSchemaCode": "supplier:info",
            "targetField": "supplier_code"
        }
    }
]'::jsonb, '物料管理数据结构', true, false, 1),

-- 7. 供应商数据结构
('supplier:info', 'supplier_info', '[
    {
        "id": "w9x0y1z2-a3b4-c5d6-e7f8-g9h0i1j2k3l4",
        "name": "supplier_code",
        "type": "uuid",
        "required": true,
        "description": "供应商编号",
        "isPrimaryKey": true
    },
    {
        "id": "x0y1z2a3-b4c5-d6e7-f8g9-h0i1j2k3l4m5",
        "name": "supplier_name",
        "type": "string",
        "required": true,
        "description": "供应商名称"
    },
    {
        "id": "y1z2a3b4-c5d6-e7f8-g9h0-i1j2k3l4m5n6",
        "name": "supplier_type",
        "type": "enum",
        "required": true,
        "description": "供应商类型",
        "enumConfig": {
            "targetEnumCode": "supplier:type",
            "multiple": false
        }
    },
    {
        "id": "z2a3b4c5-d6e7-f8g9-h0i1-j2k3l4m5n6o7",
        "name": "supplier_level",
        "type": "enum",
        "required": true,
        "description": "供应商等级",
        "enumConfig": {
            "targetEnumCode": "supplier:level",
            "multiple": false
        }
    },
    {
        "id": "a3b4c5d6-e7f8-g9h0-i1j2-k3l4m5n6o7p8",
        "name": "contact_person",
        "type": "string",
        "required": true,
        "description": "联系人"
    },
    {
        "id": "b4c5d6e7-f8g9-h0i1-j2k3-l4m5n6o7p8q9",
        "name": "contact_phone",
        "type": "string",
        "required": true,
        "description": "联系电话"
    },
    {
        "id": "c5d6e7f8-g9h0-i1j2-k3l4-m5n6o7p8q9r0",
        "name": "address",
        "type": "text",
        "required": false,
        "description": "地址"
    },
    {
        "id": "d6e7f8g9-h0i1-j2k3-l4m5-n6o7p8q9r0s1",
        "name": "status",
        "type": "enum",
        "required": true,
        "description": "供应商状态",
        "enumConfig": {
            "targetEnumCode": "system:common:status",
            "multiple": false
        }
    }
]'::jsonb, '供应商管理数据结构', true, false, 1),

-- 8. 质量检验数据结构
('quality:inspection', 'quality_inspection', '[
    {
        "id": "e7f8g9h0-i1j2-k3l4-m5n6-o7p8q9r0s1t2",
        "name": "inspection_code",
        "type": "uuid",
        "required": true,
        "description": "检验编号",
        "isPrimaryKey": true
    },
    {
        "id": "f8g9h0i1-j2k3-l4m5-n6o7-p8q9r0s1t2u3",
        "name": "inspection_type",
        "type": "enum",
        "required": true,
        "description": "检验类型",
        "enumConfig": {
            "targetEnumCode": "quality:check:type",
            "multiple": false
        }
    },
    {
        "id": "g9h0i1j2-k3l4-m5n6-o7p8-q9r0s1t2u3v4",
        "name": "workorder_code",
        "type": "relation",
        "required": false,
        "description": "关联工单",
        "relationConfig": {
            "targetSchemaCode": "production:workorder",
            "targetField": "workorder_code"
        }
    },
    {
        "id": "h0i1j2k3-l4m5-n6o7-p8q9-r0s1t2u3v4w5",
        "name": "material_code",
        "type": "relation",
        "required": false,
        "description": "关联物料",
        "relationConfig": {
            "targetSchemaCode": "material:item",
            "targetField": "material_code"
        }
    },
    {
        "id": "i1j2k3l4-m5n6-o7p8-q9r0-s1t2u3v4w5x6",
        "name": "inspector",
        "type": "string",
        "required": true,
        "description": "检验员"
    },
    {
        "id": "j2k3l4m5-n6o7-p8q9-r0s1-t2u3v4w5x6y7",
        "name": "inspection_date",
        "type": "date",
        "required": true,
        "description": "检验日期",
        "dateType": "date"
    },
    {
        "id": "k3l4m5n6-o7p8-q9r0-s1t2-u3v4w5x6y7z8",
        "name": "result",
        "type": "enum",
        "required": true,
        "description": "检验结果",
        "enumConfig": {
            "targetEnumCode": "quality:check:result",
            "multiple": false
        }
    },
    {
        "id": "l4m5n6o7-p8q9-r0s1-t2u3-v4w5x6y7z8a9",
        "name": "remarks",
        "type": "text",
        "required": false,
        "description": "检验备注"
    }
]'::jsonb, '质量检验数据结构', true, false, 1),

-- 9. 库存记录数据结构
('inventory:record', 'inventory_record', '[
    {
        "id": "m5n6o7p8-q9r0-s1t2-u3v4-w5x6y7z8a9b0",
        "name": "record_code",
        "type": "uuid",
        "required": true,
        "description": "记录编号",
        "isPrimaryKey": true
    },
    {
        "id": "n6o7p8q9-r0s1-t2u3-v4w5-x6y7z8a9b0c1",
        "name": "material_code",
        "type": "relation",
        "required": true,
        "description": "物料编号",
        "relationConfig": {
            "targetSchemaCode": "material:item",
            "targetField": "material_code"
        }
    },
    {
        "id": "o7p8q9r0-s1t2-u3v4-w5x6-y7z8a9b0c1d2",
        "name": "operation_type",
        "type": "string",
        "required": true,
        "description": "操作类型（入库/出库/盘点）"
    },
    {
        "id": "p8q9r0s1-t2u3-v4w5-x6y7-z8a9b0c1d2e3",
        "name": "quantity",
        "type": "number",
        "required": true,
        "description": "操作数量"
    },
    {
        "id": "q9r0s1t2-u3v4-w5x6-y7z8-a9b0c1d2e3f4",
        "name": "before_stock",
        "type": "number",
        "required": true,
        "description": "操作前库存"
    },
    {
        "id": "r0s1t2u3-v4w5-x6y7-z8a9-b0c1d2e3f4g5",
        "name": "after_stock",
        "type": "number",
        "required": true,
        "description": "操作后库存"
    },
    {
        "id": "s1t2u3v4-w5x6-y7z8-a9b0-c1d2e3f4g5h6",
        "name": "operator",
        "type": "string",
        "required": true,
        "description": "操作员"
    },
    {
        "id": "t2u3v4w5-x6y7-z8a9-b0c1-d2e3f4g5h6i7",
        "name": "operation_date",
        "type": "date",
        "required": true,
        "description": "操作日期",
        "dateType": "datetime"
    },
    {
        "id": "u3v4w5x6-y7z8-a9b0-c1d2-e3f4g5h6i7j8",
        "name": "remarks",
        "type": "text",
        "required": false,
        "description": "操作备注"
    }
]'::jsonb, '库存记录数据结构', true, false, 1),

-- 10. 维护记录数据结构
('equipment:maintenance', 'equipment_maintenance', '[
    {
        "id": "v4w5x6y7-z8a9-b0c1-d2e3-f4g5h6i7j8k9",
        "name": "maintenance_code",
        "type": "uuid",
        "required": true,
        "description": "维护记录编号",
        "isPrimaryKey": true
    },
    {
        "id": "w5x6y7z8-a9b0-c1d2-e3f4-g5h6i7j8k9l0",
        "name": "device_code",
        "type": "relation",
        "required": true,
        "description": "设备编号",
        "relationConfig": {
            "targetSchemaCode": "equipment:device",
            "targetField": "device_code"
        }
    },
    {
        "id": "x6y7z8a9-b0c1-d2e3-f4g5-h6i7j8k9l0m1",
        "name": "maintenance_type",
        "type": "string",
        "required": true,
        "description": "维护类型（预防性/故障/定期）"
    },
    {
        "id": "y7z8a9b0-c1d2-e3f4-g5h6-i7j8k9l0m1n2",
        "name": "maintenance_date",
        "type": "date",
        "required": true,
        "description": "维护日期",
        "dateType": "date"
    },
    {
        "id": "z8a9b0c1-d2e3-f4g5-h6i7-j8k9l0m1n2o3",
        "name": "maintainer",
        "type": "string",
        "required": true,
        "description": "维护人员"
    },
    {
        "id": "a9b0c1d2-e3f4-g5h6-i7j8-k9l0m1n2o3p4",
        "name": "maintenance_content",
        "type": "text",
        "required": true,
        "description": "维护内容"
    },
    {
        "id": "b0c1d2e3-f4g5-h6i7-j8k9-l0m1n2o3p4q5",
        "name": "cost",
        "type": "number",
        "required": false,
        "description": "维护费用"
    },
    {
        "id": "c1d2e3f4-g5h6-i7j8-k9l0-m1n2o3p4q5r6",
        "name": "next_maintenance_date",
        "type": "date",
        "required": false,
        "description": "下次维护日期",
        "dateType": "date"
    },
    {
        "id": "d2e3f4g5-h6i7-j8k9-l0m1-n2o3p4q5r6s7",
        "name": "remarks",
        "type": "text",
        "required": false,
        "description": "维护备注"
    }
]'::jsonb, '设备维护记录数据结构', true, false, 1);