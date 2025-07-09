#!/bin/bash

BASE_URL="http://localhost:3000/api"

echo "=== 测试单个创建 ==="
curl -X POST "${BASE_URL}/schemas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token-here" \
  -d '{
    "name": "test_user",
    "code": "test_user_info",
    "description": "测试用户信息",
    "fields": [
      {
        "name": "username",
        "type": "string",
        "description": "用户名",
        "isRequired": true,
        "length": 50
      }
    ]
  }' | jq '.'

echo -e "\n=== 测试批量创建 ==="
curl -X POST "${BASE_URL}/schemas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token-here" \
  -d '[
    {
      "name": "batch_user",
      "code": "batch_user_info",
      "description": "批量测试用户信息",
      "fields": [
        {
          "name": "username",
          "type": "string",
          "description": "用户名",
          "isRequired": true,
          "length": 50
        }
      ]
    },
    {
      "name": "batch_product",
      "code": "batch_product_info",
      "description": "批量测试商品信息",
      "fields": [
        {
          "name": "name",
          "type": "string",
          "description": "商品名称",
          "isRequired": true,
          "length": 100
        },
        {
          "name": "price",
          "type": "number",
          "description": "商品价格",
          "isRequired": true,
          "numberType": "decimal",
          "precision": 10,
          "scale": 2
        }
      ]
    },
    {
      "name": "invalid_schema",
      "code": "invalid_code_with_space",
      "description": "无效的数据结构",
      "fields": []
    }
  ]' | jq '.'

echo -e "\n测试完成！" 