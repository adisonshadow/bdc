// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取所有数据结构定义 GET /api/schemas */
export async function getSchemas(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getSchemasParams,
  options?: { [key: string]: any }
) {
  return request<
    {
      id?: string;
      name?: string;
      code?: string;
      description?: string;
      createdAt?: string;
      updatedAt?: string;
      fields?: (
        | API.StringField
        | API.TextField
        | API.NumberField
        | API.DateField
        | API.EnumField
        | API.RelationField
        | API.MediaField
        | API.ApiField
      )[];
    }[]
  >("/api/schemas", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 创建新的数据结构定义（支持单个或批量创建） 支持两种请求格式：
1. 单个对象：创建单个数据结构
2. 对象数组：批量创建多个数据结构，一个失败不影响其他

批量创建特性：
- 使用数据库事务确保数据一致性
- 每个表的创建失败不会影响其他表
- 返回每个表的详细创建结果
- 已存在的表会被标记为失败，但不会阻止其他表的创建
 POST /api/schemas */
export async function postSchemas(
  body:
    | {
        name: string;
        code: string;
        description?: string;
        fields: (
          | API.StringField
          | API.TextField
          | API.NumberField
          | API.DateField
          | API.EnumField
          | API.RelationField
          | API.MediaField
          | API.ApiField
        )[];
        keyIndexes?: API.keyIndexes;
      }
    | {
        name: string;
        code: string;
        description?: string;
        fields: (
          | API.StringField
          | API.TextField
          | API.NumberField
          | API.DateField
          | API.EnumField
          | API.RelationField
          | API.MediaField
          | API.ApiField
        )[];
        keyIndexes?: API.keyIndexes;
      }[],
  options?: { [key: string]: any }
) {
  return request<
    | {
        id?: string;
        name?: string;
        code?: string;
        description?: string;
        fields?: any[];
        warning?: { message?: string; code?: string };
      }
    | {
        total?: number;
        success?: number;
        failed?: number;
        results?: {
          success?: boolean;
          index?: number;
          data?: Record<string, any>;
          error?: string;
          name?: string;
          code?: string;
          warning?: { message?: string; code?: string };
        }[];
      }
  >("/api/schemas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取指定数据结构定义 GET /api/schemas/${param0} */
export async function getSchemasId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getSchemasIdParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    id?: string;
    name?: string;
    code?: string;
    description?: string;
    fields?: (
      | API.StringField
      | API.TextField
      | API.NumberField
      | API.DateField
      | API.EnumField
      | API.RelationField
      | API.MediaField
      | API.ApiField
    )[];
  }>(`/api/schemas/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 更新数据结构定义 PUT /api/schemas/${param0} */
export async function putSchemasId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putSchemasIdParams,
  body: {
    name?: string;
    description?: string;
    fields?: (
      | API.StringField
      | API.TextField
      | API.NumberField
      | API.DateField
      | API.EnumField
      | API.RelationField
      | API.MediaField
      | API.ApiField
    )[];
    keyIndexes?: API.keyIndexes;
  },
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/schemas/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 删除数据结构定义 DELETE /api/schemas/${param0} */
export async function deleteSchemasId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteSchemasIdParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/schemas/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 验证数据结构定义 POST /api/schemas/${param0}/validate */
export async function postSchemasIdValidate(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postSchemasIdValidateParams,
  body: Record<string, any>,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    isValid?: boolean;
    errors?: { field?: string; message?: string }[];
  }>(`/api/schemas/${param0}/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}
