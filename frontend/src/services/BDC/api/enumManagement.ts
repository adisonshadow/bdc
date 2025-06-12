// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取枚举列表 GET /api/enums */
export async function getEnums(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getEnumsParams,
  options?: { [key: string]: any }
) {
  return request<API.Enum[]>("/api/enums", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 创建枚举 POST /api/enums */
export async function postEnums(
  body: API.Enum,
  options?: { [key: string]: any }
) {
  return request<API.Enum>("/api/enums", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 根据ID获取枚举 GET /api/enums/${param0} */
export async function getEnumsId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getEnumsIdParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<API.Enum>(`/api/enums/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 更新枚举 PUT /api/enums/${param0} */
export async function putEnumsId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putEnumsIdParams,
  body: API.Enum,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<API.Enum>(`/api/enums/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 删除枚举 DELETE /api/enums/${param0} */
export async function deleteEnumsId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteEnumsIdParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/enums/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 根据代码获取枚举 GET /api/enums/code/${param0} */
export async function getEnumsCodeCode(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getEnumsCodeCodeParams,
  options?: { [key: string]: any }
) {
  const { code: param0, ...queryParams } = params;
  return request<API.Enum>(`/api/enums/code/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}
