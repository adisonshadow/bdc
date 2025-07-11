-- 清空现有数据
TRUNCATE TABLE bdc.enums CASCADE;
TRUNCATE TABLE bdc.data_structures CASCADE;
TRUNCATE TABLE bdc.ai_configs CASCADE;

-- 插入系统基础枚举（使用正确的字段格式）
INSERT INTO bdc.enums (code, name, options, description, is_active, is_multiple) VALUES
-- 系统通用状态枚举
('system:common:status', 'system_common_status', '[
    {"label": "启用", "value": "enabled", "description": "正常使用状态", "order": 1},
    {"label": "禁用", "value": "disabled", "description": "停用状态", "order": 2},
    {"label": "已删除", "value": "deleted", "description": "已删除状态", "order": 3}
]'::jsonb, '系统通用状态', true, false),

-- 系统是否枚举
('system:common:yesno', 'system_common_yesno', '[
    {"label": "是", "value": "yes", "description": "是", "order": 1},
    {"label": "否", "value": "no", "description": "否", "order": 2}
]'::jsonb, '系统是否选项', true, false),

-- 系统优先级枚举
('system:common:priority', 'system_common_priority', '[
    {"label": "低", "value": "low", "description": "低优先级", "order": 1},
    {"label": "普通", "value": "normal", "description": "普通优先级", "order": 2},
    {"label": "高", "value": "high", "description": "高优先级", "order": 3},
    {"label": "紧急", "value": "urgent", "description": "紧急优先级", "order": 4}
]'::jsonb, '系统优先级', true, false);

-- 插入生产管理相关枚举
INSERT INTO bdc.enums (code, name, options, description, is_active, is_multiple) VALUES
-- 生产计划状态枚举
('production:plan:status', 'production_plan_status', '[
    {"label": "草稿", "value": "draft", "description": "计划处于草稿状态", "order": 1},
    {"label": "待审核", "value": "pending", "description": "计划等待审核", "order": 2},
    {"label": "已审核", "value": "approved", "description": "计划已通过审核", "order": 3},
    {"label": "执行中", "value": "in_progress", "description": "计划正在执行", "order": 4},
    {"label": "已完成", "value": "completed", "description": "计划执行完成", "order": 5},
    {"label": "已取消", "value": "cancelled", "description": "计划已取消", "order": 6}
]'::jsonb, '生产计划状态', true, false),

-- 生产计划类型枚举
('production:plan:type', 'production_plan_type', '[
    {"label": "常规生产", "value": "regular_production", "description": "常规生产计划", "order": 1},
    {"label": "紧急生产", "value": "urgent_production", "description": "紧急生产计划", "order": 2},
    {"label": "试产", "value": "trial_production", "description": "试产计划", "order": 3},
    {"label": "样品生产", "value": "sample_production", "description": "样品生产计划", "order": 4}
]'::jsonb, '生产计划类型', true, false),

-- 生产线状态枚举
('production:line:status', 'production_line_status', '[
    {"label": "空闲", "value": "idle", "description": "生产线空闲", "order": 1},
    {"label": "运行中", "value": "running", "description": "生产线正在运行", "order": 2},
    {"label": "维护中", "value": "maintenance", "description": "生产线正在维护", "order": 3},
    {"label": "故障", "value": "fault", "description": "生产线发生故障", "order": 4},
    {"label": "停机", "value": "shutdown", "description": "生产线停机", "order": 5}
]'::jsonb, '生产线状态', true, false),

-- 生产线类型枚举 （故意留错）
('production:line:type', 'production_line_type', '[
    {"label": "装配线", "value": "", "description": "", "order": 1},
    {"label": "包装线", "value": "", "description": "", "order": 2},
    {"label": "", "value": "", "description": "", "order": 3},
    {"label": "", "value": "inspection_line", "description": "产品检验生产线", "order": 4}
]'::jsonb, '生产线类型', true, false),

-- 工单状态枚举
('production:workorder:status', 'production_workorder_status', '[
    {"label": "已创建", "value": "created", "description": "工单已创建", "order": 1},
    {"label": "已分配", "value": "assigned", "description": "工单已分配给生产线", "order": 2},
    {"label": "进行中", "value": "in_progress", "description": "工单正在执行", "order": 3},
    {"label": "暂停", "value": "paused", "description": "工单暂停执行", "order": 4},
    {"label": "已完成", "value": "completed", "description": "工单执行完成", "order": 5},
    {"label": "已取消", "value": "cancelled", "description": "工单已取消", "order": 6}
]'::jsonb, '工单状态', true, false),

-- 设备状态枚举 （故意留错）
('equipment:device:status', 'equipment_device_status', '[
    {"label": "", "value": "normal", "description": "设备运行正常", "order": 1},
    {"label": "警告", "value": "warning", "description": "设备需要关注", "order": 2},
    {"label": "故障", "value": "", "description": "设备发生故障", "order": 3},
    {"label": "维护中", "value": "maintenance", "description": "设备正在维护", "order": 4},
    {"label": "停机", "value": "", "description": "设备已停机", "order": 5}
]'::jsonb, '设备状态', true, false),

-- 设备类型枚举
('equipment:device:type', 'equipment_device_type', '[
    {"label": "生产设备", "value": "production", "description": "用于生产的主要设备", "order": 1},
    {"label": "检测设备", "value": "testing", "description": "用于质量检测的设备", "order": 2},
    {"label": "辅助设备", "value": "auxiliary", "description": "辅助生产的设备", "order": 3},
    {"label": "安全设备", "value": "safety", "description": "安全防护设备", "order": 4}
]'::jsonb, '设备类型', true, false),

-- 物料类型枚举
('material:type', 'material_type', '[
    {"label": "原材料", "value": "raw_material", "description": "生产用原材料", "order": 1},
    {"label": "半成品", "value": "semi_finished_product", "description": "生产过程中的半成品", "order": 2},
    {"label": "成品", "value": "finished_product", "description": "最终成品", "order": 3},
    {"label": "辅料", "value": "auxiliary_material", "description": "生产用辅助材料", "order": 4},
    {"label": "包装材料", "value": "packaging_material", "description": "产品包装材料", "order": 5}
]'::jsonb, '物料类型', true, false),

-- 物料单位枚举
('material:unit', 'material_unit', '[
    {"label": "件", "value": "piece", "description": "计件单位", "order": 1},
    {"label": "千克", "value": "kilogram", "description": "重量单位", "order": 2},
    {"label": "米", "value": "meter", "description": "长度单位", "order": 3},
    {"label": "平方米", "value": "square_meter", "description": "面积单位", "order": 4},
    {"label": "立方米", "value": "cubic_meter", "description": "体积单位", "order": 5},
    {"label": "升", "value": "liter", "description": "容积单位", "order": 6}
]'::jsonb, '物料单位', true, false),

-- 质量等级枚举
('quality:grade', 'quality_grade', '[
    {"label": "优等品", "value": "excellent", "description": "质量等级优等", "order": 1},
    {"label": "良等品", "value": "good", "description": "质量等级良等", "order": 2},
    {"label": "合格品", "value": "qualified", "description": "质量等级合格", "order": 3},
    {"label": "不良品", "value": "defective", "description": "质量不合格", "order": 4}
]'::jsonb, '质量等级', true, false),

-- 质检类型枚举
('quality:check:type', 'quality_check_type', '[
    {"label": "来料检验", "value": "incoming", "description": "原材料入厂检验", "order": 1},
    {"label": "过程检验", "value": "process", "description": "生产过程检验", "order": 2},
    {"label": "成品检验", "value": "final", "description": "成品出厂检验", "order": 3},
    {"label": "抽样检验", "value": "sampling", "description": "抽样质量检验", "order": 4}
]'::jsonb, '质检类型', true, false),

-- 质检结果枚举
('quality:check:result', 'quality_check_result', '[
    {"label": "合格", "value": "qualified", "description": "检验合格", "order": 1},
    {"label": "不合格", "value": "unqualified", "description": "检验不合格", "order": 2},
    {"label": "有条件合格", "value": "conditionally_qualified", "description": "有条件通过", "order": 3}
]'::jsonb, '质检结果', true, false),

-- 供应商类型枚举
('supplier:type', 'supplier_type', '[
    {"label": "制造商", "value": "manufacturer", "description": "产品制造商", "order": 1},
    {"label": "经销商", "value": "distributor", "description": "产品经销商", "order": 2},
    {"label": "服务商", "value": "service_provider", "description": "服务提供商", "order": 3},
    {"label": "物流商", "value": "logistics_provider", "description": "物流服务商", "order": 4}
]'::jsonb, '供应商类型', true, false),

-- 供应商等级枚举
('supplier:level', 'supplier_level', '[
    {"label": "A级", "value": "a_level", "description": "A级供应商", "order": 1},
    {"label": "B级", "value": "b_level", "description": "B级供应商", "order": 2},
    {"label": "C级", "value": "c_level", "description": "C级供应商", "order": 3},
    {"label": "D级", "value": "d_level", "description": "D级供应商", "order": 4}
]'::jsonb, '供应商等级', true, false),

-- 操作类型枚举（用于库存记录）
('operation_type', 'operation_type', '[
    {"label": "入库", "value": "inbound", "description": "物料入库操作", "order": 1},
    {"label": "出库", "value": "outbound", "description": "物料出库操作", "order": 2},
    {"label": "盘点", "value": "inventory", "description": "库存盘点操作", "order": 3}
]'::jsonb, '操作类型', true, false),

-- 设备维护类型枚举
('equipment:maintenance:type', 'maintenance_type', '[
    {"label": "预防性", "value": "preventive", "description": "定期预防性维护", "order": 1},
    {"label": "故障", "value": "fault", "description": "故障后维护", "order": 2},
    {"label": "定期", "value": "regular", "description": "按计划定期维护", "order": 3}
]'::jsonb, '设备维护类型', true, false);

-- 插入生产管理相关数据结构
INSERT INTO bdc.data_structures (id, code, name, fields, key_indexes, description, is_active, is_locked, version, created_at, updated_at) VALUES
-- 生产线数据结构
('1d87f83d-4c44-469e-933f-868c7f5b4c48', 'production:line', 'production_line', '[
    {
        "id": "o5p6q7r8-s9t0-u1v2-w3x4-y5z6a7b8c9d0",
        "name": "line_code",
        "type": "uuid",
        "required": true,
        "description": "生产线编号"
    },
    {
        "id": "p6q7r8s9-t0u1-v2w3-x4y5-z6a7b8c9d0e1",
        "name": "line_name",
        "type": "string",
        "length": 255,
        "required": true,
        "description": "生产线名称"
    },
    {
        "id": "q7r8s9t0-u1v2-w3x4-y5z6-a7b8c9d0e1f2",
        "name": "line_type",
        "type": "enum",
        "required": true,
        "enumConfig": {
            "multiple": false,
            "targetEnumCode": "production:line:type"
        },
        "description": "生产线类型"
    },
    {
        "id": "r8s9t0u1-v2w3-x4y5-z6a7-b8c9d0e1f2g3",
        "name": "status",
        "type": "enum",
        "required": true,
        "enumConfig": {
            "multiple": false,
            "targetEnumCode": "production:line:status"
        },
        "description": "生产线状态"
    },
    {
        "id": "s9t0u1v2-w3x4-y5z6-a7b8-c9d0e1f2g3h4",
        "name": "capacity",
        "type": "number",
        "required": true,
        "description": "日产能",
        "numberConfig": {
            "scale": 0,
            "precision": 10,
            "numberType": "integer"
        }
    },
    {
        "id": "t0u1v2w3-x4y5-z6a7-b8c9-d0e1f2g3h4i5",
        "name": "manager",
        "type": "string",
        "length": 255,
        "required": true,
        "description": "生产线负责人"
    },
    {
        "id": "u1v2w3x4-y5z6-a7b8-c9d0-e1f2g3h4i5j6",
        "name": "last_maintenance_date",
        "type": "date",
        "required": false,
        "dateConfig": {
            "dateType": "date"
        },
        "description": "最后维护日期"
    },
    {
        "id": "created_at",
        "name": "created_at",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "创建时间"
    },
    {
        "id": "updated_at",
        "name": "updated_at",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "更新时间"
    }
]'::jsonb, '{
    "indexes": [
        {"name": "idx_production_line_status", "type": "normal", "fields": ["status"]},
        {"name": "idx_production_line_line_type", "type": "normal", "fields": ["line_type"]},
        {"name": "idx_production_line_capacity", "type": "normal", "fields": ["capacity"]}
    ],
    "primaryKey": ["line_code"]
}'::jsonb, '生产线数据结构', true, true, 2, '2025-07-09T18:40:01.127Z', '2025-07-10T09:17:27.059Z'),

-- 设备管理数据结构
('a97f4abb-6a4e-4b00-866e-112181c75b86', 'equipment:device', 'equipment_device', '[
    {
        "id": "e1f2g3h4-i5j6-k7l8-m9n0-o1p2q3r4s5t6",
        "name": "device_code",
        "type": "uuid",
        "required": true,
        "description": "设备编号"
    },
    {
        "id": "f2g3h4i5-j6k7-l8m9-n0o1-p2q3r4s5t6u7",
        "name": "device_name",
        "type": "string",
        "length": 255,
        "required": true,
        "description": "设备名称"
    },
    {
        "id": "g3h4i5j6-k7l8-m9n0-o1p2-q3r4s5t6u7v8",
        "name": "device_type",
        "type": "enum",
        "required": true,
        "enumConfig": {
            "multiple": false,
            "targetEnumCode": "equipment:device:type"
        },
        "description": "设备类型"
    },
    {
        "id": "h4i5j6k7-l8m9-n0o1-p2q3-r4s5t6u7v8w9",
        "name": "line_code",
        "type": "relation",
        "required": false,
        "description": "所属生产线",
        "relationConfig": {
            "multiple": false,
            "targetField": "line_code",
            "cascadeDelete": "setNull",
            "displayFields": [
                "line_code",
                "line_name"
            ],
            "targetSchemaCode": "production:line"
        }
    },
    {
        "id": "i5j6k7l8-m9n0-o1p2-q3r4-s5t6u7v8w9x0",
        "name": "manufacturer",
        "type": "string",
        "length": 255,
        "required": true,
        "description": "制造商"
    },
    {
        "id": "j6k7l8m9-n0o1-p2q3-r4s5-t6u7v8w9x0y1",
        "name": "model",
        "type": "string",
        "length": 255,
        "required": true,
        "description": "设备型号"
    },
    {
        "id": "k7l8m9n0-o1p2-q3r4-s5t6-u7v8w9x0y1z2",
        "name": "purchase_date",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "date"
        },
        "description": "购买日期"
    },
    {
        "id": "l8m9n0o1-p2q3-r4s5-t6u7-v8w9x0y1z2a3",
        "name": "status",
        "type": "enum",
        "required": true,
        "enumConfig": {
            "multiple": false,
            "targetEnumCode": "equipment:device:status"
        },
        "description": "设备状态"
    },
    {
        "id": "m9n0o1p2-q3r4-s5t6-u7v8-w9x0y1z2a3b4",
        "name": "last_maintenance_date",
        "type": "date",
        "required": false,
        "dateConfig": {
            "dateType": "date"
        },
        "description": "最后维护日期"
    },
    {
        "id": "n0o1p2q3-r4s5-t6u7-v8w9-x0y1z2a3b4c5",
        "name": "created_at",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "创建时间"
    },
    {
        "id": "o1p2q3r4-s5t6-u7v8-w9x0-y1z2a3b4c5d6",
        "name": "updated_at",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "更新时间"
    }
]'::jsonb, '{
    "indexes": [
        {"name": "idx_equipment_device_device_name", "type": "normal", "fields": ["device_name"]},
        {"name": "idx_equipment_device_status", "type": "normal", "fields": ["status"]},
        {"name": "idx_equipment_device_purchase_date", "type": "normal", "fields": ["purchase_date"]}
    ],
    "primaryKey": ["device_code"]
}'::jsonb, '设备管理数据结构', true, false, 2, '2025-07-09T18:40:01.127Z', '2025-07-10T09:35:55.532Z'),

-- 供应商管理数据结构
('61347bab-a7f0-4f77-8357-982f510ea5d7', 'supplier:info', 'supplier_info', '[
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
        "enumConfig": {
            "multiple": false,
            "targetEnumCode": "supplier:type"
        },
        "description": "供应商类型"
    },
    {
        "id": "z2a3b4c5-d6e7-f8g9-h0i1-j2k3l4m5n6o7",
        "name": "supplier_level",
        "type": "enum",
        "required": true,
        "enumConfig": {
            "multiple": false,
            "targetEnumCode": "supplier:level"
        },
        "description": "供应商等级"
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
        "enumConfig": {
            "multiple": false,
            "targetEnumCode": "system:common:status"
        },
        "description": "供应商状态"
    }
]'::jsonb, NULL, '供应商管理数据结构', true, false, 1, '2025-07-09T18:40:01.127Z', '2025-07-09T18:40:01.127Z'),

-- 物料管理数据结构
('804db4f8-532b-474e-bc98-778e3ec28024', 'material:item', 'material_item', '[
    {
        "id": "n0o1p2q3-r4s5-t6u7-v8w9-x0y1z2a3b4c5",
        "name": "material_code",
        "type": "uuid",
        "required": true,
        "description": "物料编号"
    },
    {
        "id": "o1p2q3r4-s5t6-u7v8-w9x0-y1z2a3b4c5d6",
        "name": "material_name",
        "type": "string",
        "length": 255,
        "required": true,
        "description": "物料名称"
    },
    {
        "id": "p2q3r4s5-t6u7-v8w9-x0y1-z2a3b4c5d6e7",
        "name": "material_type",
        "type": "enum",
        "required": true,
        "enumConfig": {
            "multiple": false,
            "targetEnumCode": "material:type"
        },
        "description": "物料类型"
    },
    {
        "id": "q3r4s5t6-u7v8-w9x0-y1z2-a3b4c5d6e7f8",
        "name": "specification",
        "type": "string",
        "length": 255,
        "required": true,
        "description": "规格型号"
    },
    {
        "id": "r4s5t6u7-v8w9-x0y1-z2a3-b4c5d6e7f8g9",
        "name": "unit",
        "type": "enum",
        "required": true,
        "enumConfig": {
            "multiple": false,
            "targetEnumCode": "material:unit"
        },
        "description": "计量单位"
    },
    {
        "id": "s5t6u7v8-w9x0-y1z2-a3b4-c5d6e7f8g9h0",
        "name": "current_stock",
        "type": "number",
        "required": true,
        "description": "当前库存",
        "numberConfig": {
            "scale": 0,
            "precision": 10,
            "numberType": "integer"
        }
    },
    {
        "id": "t6u7v8w9-x0y1-z2a3-b4c5-d6e7f8g9h0i1",
        "name": "min_stock",
        "type": "number",
        "required": true,
        "description": "最低库存",
        "numberConfig": {
            "scale": 0,
            "precision": 10,
            "numberType": "integer"
        }
    },
    {
        "id": "u7v8w9x0-y1z2-a3b4-c5d6-e7f8g9h0i1j2",
        "name": "max_stock",
        "type": "number",
        "required": true,
        "description": "最高库存",
        "numberConfig": {
            "scale": 0,
            "precision": 10,
            "numberType": "integer"
        }
    },
    {
        "id": "v8w9x0y1-z2a3-b4c5-d6e7-f8g9h0i1j2k3",
        "name": "supplier_code",
        "type": "relation",
        "required": true,
        "description": "供应商编号",
        "relationConfig": {
            "multiple": false,
            "targetField": "supplier_code",
            "cascadeDelete": "restrict",
            "targetSchemaCode": "supplier:info"
        }
    },
    {
        "id": "created_at",
        "name": "created_at",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "创建时间"
    },
    {
        "id": "updated_at",
        "name": "updated_at",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "更新时间"
    }
]'::jsonb, '{
    "indexes": [
        {"name": "idx_material_item_material_name", "type": "normal", "fields": ["material_name"]},
        {"name": "idx_material_item_material_type", "type": "normal", "fields": ["material_type"]},
        {"name": "idx_material_item_unit", "type": "normal", "fields": ["unit"]},
        {"name": "idx_material_item_supplier_code", "type": "normal", "fields": ["supplier_code"]},
        {"name": "idx_material_item_created_at", "type": "normal", "fields": ["created_at"]},
        {"name": "idx_material_item_updated_at", "type": "normal", "fields": ["updated_at"]}
    ],
    "primaryKey": ["material_code"]
}'::jsonb, '物料管理数据结构', true, false, 2, '2025-07-09T18:40:01.127Z', '2025-07-10T09:18:41.474Z'),

-- 质量检验数据结构
('a483dc82-0ab9-4e76-b9ec-3db7c40eb182', 'quality:inspection', 'quality_inspection', '[
    {
        "id": "e7f8g9h0-i1j2-k3l4-m5n6-o7p8q9r0s1t2",
        "name": "inspection_code",
        "type": "uuid",
        "required": true,
        "description": "检验编号"
    },
    {
        "id": "f8g9h0i1-j2k3-l4m5-n6o7-p8q9r0s1t2u3",
        "name": "inspection_type",
        "type": "enum",
        "required": true,
        "enumConfig": {
            "multiple": false,
            "targetEnumCode": "quality:check:type"
        },
        "description": "检验类型"
    },
    {
        "id": "g9h0i1j2-k3l4-m5n6-o7p8-q9r0s1t2u3v4",
        "name": "workorder_code",
        "type": "relation",
        "required": false,
        "description": "关联工单",
        "relationConfig": {
            "multiple": false,
            "targetField": "workorder_code",
            "cascadeDelete": "setNull",
            "displayFields": [
                "workorder_code"
            ],
            "targetSchemaCode": "production:workorder"
        }
    },
    {
        "id": "h0i1j2k3-l4m5-n6o7-p8q9-r0s1t2u3v4w5",
        "name": "material_code",
        "type": "relation",
        "required": false,
        "description": "关联物料",
        "relationConfig": {
            "multiple": false,
            "targetField": "material_code",
            "cascadeDelete": "setNull",
            "displayFields": [
                "material_code"
            ],
            "targetSchemaCode": "material:item"
        }
    },
    {
        "id": "i1j2k3l4-m5n6-o7p8-q9r0-s1t2u3v4w5x6",
        "name": "inspector",
        "type": "string",
        "length": 255,
        "required": true,
        "description": "检验员"
    },
    {
        "id": "j2k3l4m5-n6o7-p8q9-r0s1-t2u3v4w5x6y7",
        "name": "inspection_date",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "date"
        },
        "description": "检验日期"
    },
    {
        "id": "k3l4m5n6-o7p8-q9r0-s1t2-u3v4w5x6y7z8",
        "name": "result",
        "type": "enum",
        "required": true,
        "enumConfig": {
            "multiple": false,
            "targetEnumCode": "quality:check:result"
        },
        "description": "检验结果"
    },
    {
        "id": "l4m5n6o7-p8q9-r0s1-t2u3-v4w5x6y7z8a9",
        "name": "remarks",
        "type": "text",
        "required": false,
        "description": "检验备注"
    },
    {
        "id": "created_at",
        "name": "created_at",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "创建时间"
    },
    {
        "id": "updated_at",
        "name": "updated_at",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "更新时间"
    }
]'::jsonb, '{
    "indexes": [
        {"name": "idx_quality_inspection_inspection_type", "type": "normal", "fields": ["inspection_type"]},
        {"name": "idx_quality_inspection_inspection_date", "type": "normal", "fields": ["inspection_date"]},
        {"name": "idx_quality_inspection_result", "type": "normal", "fields": ["result"]}
    ],
    "primaryKey": ["inspection_code"]
}'::jsonb, '质量检验数据结构', true, false, 2, '2025-07-09T18:40:01.127Z', '2025-07-10T09:34:33.225Z'),

-- 库存记录数据结构
('040f0efb-a2a2-4182-8146-3c4fe79d1342', 'inventory:record', 'inventory_record', '[
    {
        "id": "m5n6o7p8-q9r0-s1t2-u3v4-w5x6y7z8a9b0",
        "name": "record_code",
        "type": "uuid",
        "required": true,
        "description": "记录编号"
    },
    {
        "id": "n6o7p8q9-r0s1-t2u3-v4w5-x6y7z8a9b0c1",
        "name": "material_code",
        "type": "relation",
        "required": true,
        "description": "物料编号",
        "relationConfig": {
            "multiple": false,
            "targetField": "material_code",
            "cascadeDelete": "restrict",
            "displayFields": [
                "name",
                "code"
            ],
            "targetSchemaCode": "material:item"
        }
    },
    {
        "id": "o7p8q9r0-s1t2-u3v4-w5x6-y7z8a9b0c1d2",
        "name": "operation_type",
        "type": "enum",
        "required": true,
        "enumConfig": {
            "multiple": false,
            "defaultValues": [],
            "targetEnumCode": "operation_type"
        },
        "description": "操作类型（入库/出库/盘点）"
    },
    {
        "id": "p8q9r0s1-t2u3-v4w5-x6y7-z8a9b0c1d2e3",
        "name": "quantity",
        "type": "number",
        "required": true,
        "description": "操作数量",
        "numberConfig": {
            "scale": 0,
            "precision": 10,
            "numberType": "integer"
        }
    },
    {
        "id": "q9r0s1t2-u3v4-w5x6-y7z8-a9b0c1d2e3f4",
        "name": "before_stock",
        "type": "number",
        "required": true,
        "description": "操作前库存",
        "numberConfig": {
            "scale": 0,
            "precision": 10,
            "numberType": "integer"
        }
    },
    {
        "id": "r0s1t2u3-v4w5-x6y7-z8a9-b0c1d2e3f4g5",
        "name": "after_stock",
        "type": "number",
        "required": true,
        "description": "操作后库存",
        "numberConfig": {
            "scale": 0,
            "precision": 10,
            "numberType": "integer"
        }
    },
    {
        "id": "s1t2u3v4-w5x6-y7z8-a9b0-c1d2e3f4g5h6",
        "name": "operator",
        "type": "string",
        "length": 255,
        "required": true,
        "description": "操作员"
    },
    {
        "id": "t2u3v4w5-x6y7-z8a9-b0c1-d2e3f4g5h6i7",
        "name": "operation_date",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "操作日期"
    },
    {
        "id": "u3v4w5x6-y7z8-a9b0-c1d2-e3f4g5h6i7j8",
        "name": "remarks",
        "type": "text",
        "required": false,
        "description": "操作备注"
    },
    {
        "id": "v4w5x6y7-z8a9-b0c1-d2e3-f4g5h6i7j8k9",
        "name": "created_at",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "记录创建时间"
    },
    {
        "id": "w5x6y7z8-a9b0-c1d2-e3f4-g5h6i7j8k9l0",
        "name": "updated_at",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "记录更新时间"
    }
]'::jsonb, '{
    "indexes": [
        {"name": "idx_inventory_record_material_code", "type": "normal", "fields": ["material_code"]},
        {"name": "idx_inventory_record_operation_date", "type": "normal", "fields": ["operation_date"]},
        {"name": "idx_inventory_record_operator", "type": "normal", "fields": ["operator"]}
    ],
    "primaryKey": ["record_code"]
}'::jsonb, '库存记录数据结构', true, false, 3, '2025-07-09T18:40:01.127Z', '2025-07-10T09:55:38.070Z'),

-- 生产计划主数据结构
('4301c5b4-34a6-4142-b8ee-2ed30ad75250', 'production:plan', 'production_plan', '[
    {
        "id": "f8d7e6c5-b4a3-2c1d-9e8f-7a6b5c4d3e2f",
        "name": "plan_code",
        "type": "uuid",
        "required": true,
        "description": "计划编号"
    },
    {
        "id": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
        "name": "plan_type",
        "type": "enum",
        "required": true,
        "enumConfig": {
            "multiple": false,
            "targetEnumCode": "production:plan:type"
        },
        "description": "计划类型"
    },
    {
        "id": "b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7",
        "name": "product_code",
        "type": "relation",
        "required": true,
        "description": "产品编号",
        "relationConfig": {
            "multiple": false,
            "targetField": "product_code",
            "cascadeDelete": "restrict",
            "targetSchemaCode": "production:product"
        }
    },
    {
        "id": "c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8",
        "name": "planned_quantity",
        "type": "number",
        "required": true,
        "description": "计划数量",
        "numberConfig": {
            "scale": 0,
            "precision": 20,
            "numberType": "integer"
        }
    },
    {
        "id": "d4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9",
        "name": "start_date",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "计划开始日期"
    },
    {
        "id": "e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0",
        "name": "end_date",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "计划结束日期"
    },
    {
        "id": "f6g7h8i9-j0k1-l2m3-n4o5-p6q7r8s9t0u1",
        "name": "status",
        "type": "enum",
        "required": true,
        "enumConfig": {
            "multiple": false,
            "targetEnumCode": "production:plan:status"
        },
        "description": "计划状态"
    },
    {
        "id": "g7h8i9j0-k1l2-m3n4-o5p6-q7r8s9t0u1v2",
        "name": "priority",
        "type": "enum",
        "required": true,
        "enumConfig": {
            "multiple": false,
            "targetEnumCode": "system:common:priority"
        },
        "description": "优先级"
    },
    {
        "id": "h8i9j0k1-l2m3-n4o5-p6q7-r8s9t0u1v2w3",
        "name": "remark",
        "type": "text",
        "required": false,
        "description": "备注"
    },
    {
        "id": "system:created_at",
        "name": "created_at",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "创建时间"
    },
    {
        "id": "system:updated_at",
        "name": "updated_at",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "更新时间"
    }
]'::jsonb, '{
    "indexes": [
        {"name": "idx_production_plan_plan_type_status", "type": "normal", "fields": ["plan_type", "status"]},
        {"name": "idx_production_plan_time_range", "type": "normal", "fields": ["start_date", "end_date"]},
        {"name": "idx_production_plan_product_priority", "type": "normal", "fields": ["product_code", "priority"]}
    ],
    "primaryKey": ["plan_code"]
}'::jsonb, '生产计划主数据结构', true, true, 2, '2025-07-09T18:40:01.127Z', '2025-07-10T09:16:46.581Z'),

-- 生产工单数据结构
('b479de75-a6c8-46e4-b155-ab9d2160d142', 'production:workorder', 'production_workorder', '[
    {
        "id": "v2w3x4y5-z6a7-b8c9-d0e1-f2g3h4i5j6k7",
        "name": "workorder_code",
        "type": "uuid",
        "required": true,
        "description": "工单编号"
    },
    {
        "id": "w3x4y5z6-a7b8-c9d0-e1f2-g3h4i5j6k7l8",
        "name": "plan_code",
        "type": "relation",
        "required": true,
        "description": "关联计划编号",
        "relationConfig": {
            "multiple": false,
            "targetField": "plan_code",
            "cascadeDelete": "restrict",
            "displayFields": [
                "name",
                "code"
            ],
            "targetSchemaCode": "production:plan"
        }
    },
    {
        "id": "x4y5z6a7-b8c9-d0e1-f2g3-h4i5j6k7l8m9",
        "name": "line_code",
        "type": "relation",
        "required": true,
        "description": "生产线编号",
        "relationConfig": {
            "multiple": false,
            "targetField": "line_code",
            "cascadeDelete": "restrict",
            "displayFields": [
                "name",
                "code"
            ],
            "targetSchemaCode": "production:line"
        }
    },
    {
        "id": "y5z6a7b8-c9d0-e1f2-g3h4-i5j6k7l8m9n0",
        "name": "product_code",
        "type": "relation",
        "required": true,
        "description": "产品编号",
        "relationConfig": {
            "multiple": false,
            "targetField": "product_code",
            "cascadeDelete": "restrict",
            "displayFields": [
                "name",
                "code"
            ],
            "targetSchemaCode": "production:product"
        }
    },
    {
        "id": "z6a7b8c9-d0e1-f2g3-h4i5-j6k7l8m9n0o1",
        "name": "quantity",
        "type": "number",
        "required": true,
        "description": "生产数量",
        "numberConfig": {
            "scale": 0,
            "precision": 10,
            "numberType": "integer"
        }
    },
    {
        "id": "a7b8c9d0-e1f2-g3h4-i5j6-k7l8m9n0o1p2",
        "name": "status",
        "type": "enum",
        "required": true,
        "enumConfig": {
            "multiple": false,
            "targetEnumCode": "production:workorder:status"
        },
        "description": "工单状态"
    },
    {
        "id": "b8c9d0e1-f2g3-h4i5-j6k7-l8m9n0o1p2q3",
        "name": "quality_grade",
        "type": "enum",
        "required": false,
        "enumConfig": {
            "multiple": false,
            "targetEnumCode": "quality:grade"
        },
        "description": "质量等级"
    },
    {
        "id": "c9d0e1f2-g3h4-i5j6-k7l8-m9n0o1p2q3r4",
        "name": "start_time",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "开始时间"
    },
    {
        "id": "d0e1f2g3-h4i5-j6k7-l8m9-n0o1p2q3r4s5",
        "name": "end_time",
        "type": "date",
        "required": false,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "结束时间"
    }
]'::jsonb, '{
    "indexes": [
        {"name": "idx_production_workorder_plan_code", "type": "normal", "fields": ["plan_code"]},
        {"name": "idx_production_workorder_line_code", "type": "normal", "fields": ["line_code"]},
        {"name": "idx_production_workorder_product_code", "type": "normal", "fields": ["product_code"]},
        {"name": "idx_production_workorder_status", "type": "normal", "fields": ["status"]},
        {"name": "idx_production_workorder_start_time", "type": "normal", "fields": ["start_time"]},
        {"name": "idx_production_workorder_end_time", "type": "normal", "fields": ["end_time"]}
    ],
    "primaryKey": ["workorder_code"]
}'::jsonb, '生产工单数据结构', true, true, 2, '2025-07-09T18:40:01.127Z', '2025-07-10T09:17:06.413Z'),

-- 设备维护记录数据结构
('afe30e7e-556d-4234-a7fc-ad7e82cef417', 'equipment:maintenance', 'equipment_maintenance', '[
    {
        "id": "v4w5x6y7-z8a9-b0c1-d2e3-f4g5h6i7j8k9",
        "name": "maintenance_code",
        "type": "uuid",
        "required": true,
        "description": "维护记录编号"
    },
    {
        "id": "w5x6y7z8-a9b0-c1d2-e3f4-g5h6i7j8k9l0",
        "name": "device_code",
        "type": "relation",
        "required": true,
        "description": "设备编号",
        "relationConfig": {
            "multiple": false,
            "targetField": "device_code",
            "cascadeDelete": "restrict",
            "displayFields": [
                "device_code",
                "device_name"
            ],
            "targetSchemaCode": "equipment:device"
        }
    },
    {
        "id": "x6y7z8a9-b0c1-d2e3-f4g5-h6i7j8k9l0m1",
        "name": "maintenance_type",
        "type": "enum",
        "required": true,
        "enumConfig": {
            "multiple": false,
            "defaultValues": [],
            "targetEnumCode": "equipment:maintenance:type"
        },
        "description": "维护类型（预防性/故障/定期）"
    },
    {
        "id": "y7z8a9b0-c1d2-e3f4-g5h6-i7j8k9l0m1n2",
        "name": "maintenance_date",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "date"
        },
        "description": "维护日期"
    },
    {
        "id": "z8a9b0c1-d2e3-f4g5-h6i7-j8k9l0m1n2o3",
        "name": "maintainer",
        "type": "string",
        "length": 255,
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
        "description": "维护费用",
        "numberConfig": {
            "scale": 2,
            "precision": 10,
            "numberType": "decimal"
        }
    },
    {
        "id": "c1d2e3f4-g5h6-i7j8-k9l0-m1n2o3p4q5r6",
        "name": "next_maintenance_date",
        "type": "date",
        "required": false,
        "dateConfig": {
            "dateType": "date"
        },
        "description": "下次维护日期"
    },
    {
        "id": "d2e3f4g5-h6i7-j8k9-l0m1-n2o3p4q5r6s7",
        "name": "remarks",
        "type": "text",
        "required": false,
        "description": "维护备注"
    },
    {
        "id": "e3f4g5h6-i7j8-k9l0-m1n2-o3p4q5r6s7t8",
        "name": "created_at",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "记录创建时间"
    },
    {
        "id": "f4g5h6i7-j8k9-l0m1-n2o3-p4q5r6s7t8u9",
        "name": "updated_at",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "记录更新时间"
    }
]'::jsonb, '{
    "indexes": [
        {"name": "idx_equipment_maintenance_device_code", "type": "normal", "fields": ["device_code"]},
        {"name": "idx_equipment_maintenance_maintenance_date", "type": "normal", "fields": ["maintenance_date"]},
        {"name": "idx_equipment_maintenance_next_maintenance_date", "type": "normal", "fields": ["next_maintenance_date"]}
    ],
    "primaryKey": ["maintenance_code"]
}'::jsonb, '设备维护记录数据结构', true, false, 2, '2025-07-09T18:40:01.127Z', '2025-07-10T09:52:25.650Z'),

-- 产品数据结构
('26115bdc-8df8-4999-8a00-19f68d73a40f', 'production:product', 'production_product', '[
    {
        "id": "field_001",
        "name": "id",
        "type": "uuid",
        "required": true,
        "description": "产品唯一标识"
    },
    {
        "id": "field_002",
        "name": "product_code",
        "type": "string",
        "length": 36,
        "required": true,
        "description": "产品编号"
    },
    {
        "id": "field_003",
        "name": "product_name",
        "type": "string",
        "length": 255,
        "required": true,
        "description": "产品名称"
    },
    {
        "id": "field_004",
        "name": "product_type",
        "type": "string",
        "length": 255,
        "required": true,
        "description": "产品类型"
    },
    {
        "id": "field_005",
        "name": "specification",
        "type": "text",
        "required": false,
        "description": "产品规格"
    },
    {
        "id": "field_006",
        "name": "unit",
        "type": "enum",
        "required": true,
        "enumConfig": {
            "multiple": false,
            "targetEnumCode": "material:unit"
        },
        "description": "计量单位"
    },
    {
        "id": "field_007",
        "name": "status",
        "type": "enum",
        "required": true,
        "enumConfig": {
            "multiple": false,
            "targetEnumCode": "system:common:status"
        },
        "description": "产品状态"
    },
    {
        "id": "field_008",
        "name": "created_at",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "创建时间"
    },
    {
        "id": "field_009",
        "name": "updated_at",
        "type": "date",
        "required": true,
        "dateConfig": {
            "dateType": "datetime"
        },
        "description": "更新时间"
    }
]'::jsonb, '{
    "indexes": [
        {"name": "idx_production_product_product_code", "type": "unique", "fields": ["product_code"]},
        {"name": "idx_production_product_product_name", "type": "normal", "fields": ["product_name"]},
        {"name": "idx_production_product_status", "type": "normal", "fields": ["status"]},
        {"name": "idx_production_product_created_at", "type": "normal", "fields": ["created_at"]}
    ],
    "primaryKey": ["id"]
}'::jsonb, '产品数据结构', true, true, 3, '2025-07-09T18:40:01.127Z', '2025-07-10T09:17:13.462Z');

-- 插入AI配置模拟数据
INSERT INTO bdc.ai_configs (id, provider, api_url, api_key, auth_header, model, config, created_at, updated_at) VALUES
('b5972314-7d14-4246-9b7a-3e9392da25dd', 'google', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', 'AIzaSyABOSp-ZNsovd8CbVncwu-GIvZpgESip4o', 'X-goog-api-key', 'gemini-2.0-flash', NULL, '2025-07-10T03:40:10.299Z', '2025-07-10T04:10:42.276Z'),
('8e875781-4ddb-42f7-ba31-e17905279e05', 'BigModal', 'https://open.bigmodel.cn/api/paas/v4/chat/completions', 'eec210fd6e1841308bfbcb82cee02a98.fXpHKjk2NBgumLRW', 'Authorization', 'glm-4-plus', NULL, '2025-07-09T20:05:18.529Z', '2025-07-10T04:10:36.317Z'),
('7fb805d3-6a26-4ee1-b10c-4830bc78edeb', 'doubao', 'https://ark.cn-beijing.volces.com/api/v3', '7fc0b313-69cb-420d-b7f3-04e6658242e6', 'Authorization', 'deepseek-v3-250324', NULL, '2025-07-09T18:57:38.607Z', '2025-07-10T04:10:36.317Z');