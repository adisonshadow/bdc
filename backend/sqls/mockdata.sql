-- 清空现有数据
TRUNCATE TABLE bdc.data_structure CASCADE;

-- 插入生产计划管理数据结构
INSERT INTO bdc.data_structure (name, schema, "isActive", version)
VALUES (
  '生产计划',
  '{
    "fields": [
      {
        "name": "planCode",
        "type": "string",
        "required": true,
        "description": "计划编号"
      },
      {
        "name": "productName",
        "type": "string",
        "required": true,
        "description": "产品名称"
      },
      {
        "name": "plannedQuantity",
        "type": "number",
        "required": true,
        "description": "计划数量"
      },
      {
        "name": "startDate",
        "type": "date",
        "required": true,
        "description": "开始日期"
      },
      {
        "name": "endDate",
        "type": "date",
        "required": true,
        "description": "结束日期"
      },
      {
        "name": "status",
        "type": "enum",
        "required": true,
        "description": "计划状态",
        "options": ["未开始", "进行中", "已完成", "已取消"]
      }
    ]
  }'::jsonb,
  true,
  1
);

-- 插入设备管理数据结构
INSERT INTO bdc.data_structure (name, schema, "isActive", version)
VALUES (
  '设备',
  '{
    "fields": [
      {
        "name": "deviceCode",
        "type": "string",
        "required": true,
        "description": "设备编号"
      },
      {
        "name": "deviceName",
        "type": "string",
        "required": true,
        "description": "设备名称"
      },
      {
        "name": "deviceType",
        "type": "string",
        "required": true,
        "description": "设备类型"
      },
      {
        "name": "manufacturer",
        "type": "string",
        "required": true,
        "description": "制造商"
      },
      {
        "name": "purchaseDate",
        "type": "date",
        "required": true,
        "description": "购买日期"
      },
      {
        "name": "status",
        "type": "enum",
        "required": true,
        "description": "设备状态",
        "options": ["运行中", "待机", "维修中", "已报废"]
      },
      {
        "name": "lastMaintenanceDate",
        "type": "date",
        "required": false,
        "description": "最后维护日期"
      }
    ]
  }'::jsonb,
  true,
  1
);

-- 插入原材料管理数据结构
INSERT INTO bdc.data_structure (name, schema, "isActive", version)
VALUES (
  '原材料',
  '{
    "fields": [
      {
        "name": "materialCode",
        "type": "string",
        "required": true,
        "description": "材料编号"
      },
      {
        "name": "materialName",
        "type": "string",
        "required": true,
        "description": "材料名称"
      },
      {
        "name": "specification",
        "type": "string",
        "required": true,
        "description": "规格型号"
      },
      {
        "name": "unit",
        "type": "string",
        "required": true,
        "description": "计量单位"
      },
      {
        "name": "currentStock",
        "type": "number",
        "required": true,
        "description": "当前库存"
      },
      {
        "name": "minStock",
        "type": "number",
        "required": true,
        "description": "最低库存"
      },
      {
        "name": "maxStock",
        "type": "number",
        "required": true,
        "description": "最高库存"
      },
      {
        "name": "supplier",
        "type": "string",
        "required": true,
        "description": "供应商"
      }
    ]
  }'::jsonb,
  true,
  1
); 