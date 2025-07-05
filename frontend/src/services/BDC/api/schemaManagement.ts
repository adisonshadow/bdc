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

/** 创建新的数据结构定义 POST /api/schemas */
export async function postSchemas(
  body: {
    /** 数据结构名称 */
    name: string;
    /** 数据结构代码 */
    code: string;
    /** 数据结构描述 */
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
    keyIndexes?: {
      primaryKey?: string[];
      indexes?: {
        name?: string;
        fields?: string[];
        type?: "unique" | "index" | "fulltext" | "spatial";
      }[];
    };
  },
  options?: { [key: string]: any }
) {
  return request<any>("/api/schemas", {
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
    keyIndexes?: {
      primaryKey?: string[];
      indexes?: {
        name?: string;
        fields?: string[];
        type?: "unique" | "index" | "fulltext" | "spatial";
      }[];
    };
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
