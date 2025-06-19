// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取数据库连接列表 分页获取数据库连接列表，支持按类型、状态和是否激活进行筛选 GET /api/database-connections */
export async function getDatabaseConnections(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDatabaseConnectionsParams,
  options?: { [key: string]: any }
) {
  return request<{
    success?: boolean;
    data?: {
      items?: API.DatabaseConnection[];
      total?: number;
      page?: number;
      limit?: number;
    };
  }>("/api/database-connections", {
    method: "GET",
    params: {
      // page has a default value: 1
      page: "1",
      // limit has a default value: 10
      limit: "10",

      ...params,
    },
    ...(options || {}),
  });
}

/** 创建数据库连接 创建新的数据库连接配置 POST /api/database-connections */
export async function postDatabaseConnections(
  body: API.DatabaseConnectionCreate,
  options?: { [key: string]: any }
) {
  return request<{ success?: boolean; data?: API.DatabaseConnection }>(
    "/api/database-connections",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}

/** 获取单个数据库连接 根据ID获取数据库连接详情 GET /api/database-connections/${param0} */
export async function getDatabaseConnectionsId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDatabaseConnectionsIdParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{ success?: boolean; data?: API.DatabaseConnection }>(
    `/api/database-connections/${param0}`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 更新数据库连接 更新指定ID的数据库连接配置 PUT /api/database-connections/${param0} */
export async function putDatabaseConnectionsId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putDatabaseConnectionsIdParams,
  body: API.DatabaseConnectionUpdate,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{ success?: boolean; data?: API.DatabaseConnection }>(
    `/api/database-connections/${param0}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      params: { ...queryParams },
      data: body,
      ...(options || {}),
    }
  );
}

/** 删除数据库连接 删除指定ID的数据库连接 DELETE /api/database-connections/${param0} */
export async function deleteDatabaseConnectionsId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteDatabaseConnectionsIdParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{ success?: boolean; message?: string }>(
    `/api/database-connections/${param0}`,
    {
      method: "DELETE",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 测试数据库连接 测试指定ID的数据库连接是否可用 POST /api/database-connections/${param0}/test */
export async function postDatabaseConnectionsIdTest(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postDatabaseConnectionsIdTestParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    success?: boolean;
    message?: string;
    data?: API.DatabaseConnectionTestResult;
  }>(`/api/database-connections/${param0}/test`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}
