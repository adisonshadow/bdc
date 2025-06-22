// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 物化表结构到数据库 将选中的表结构物化到指定的数据库连接中 POST /api/materialize-tables */
export async function postMaterializeTables(
  body: {
    /** 数据库连接ID */
    connectionId: string;
    /** 要物化的表结构代码列表 */
    schemaCodes: string[];
    config?: {
      overwrite?: boolean;
      includeIndexes?: boolean;
      includeConstraints?: boolean;
      targetSchema?: string;
      tablePrefix?: string;
    };
  },
  options?: { [key: string]: any }
) {
  return request<{
    success?: boolean;
    message?: string;
    results?: {
      schemaCode?: string;
      success?: boolean;
      message?: string;
      tableName?: string;
      error?: string;
    }[];
  }>("/api/materialize-tables", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取物化历史记录 分页获取表物化的历史记录 GET /api/materialize-tables/history */
export async function getMaterializeTablesHistory(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getMaterializeTablesHistoryParams,
  options?: { [key: string]: any }
) {
  return request<{
    success?: boolean;
    data?: {
      items?: {
        id?: string;
        connectionId?: string;
        connectionName?: string;
        schemaCodes?: string[];
        config?: Record<string, any>;
        status?: "success" | "failed" | "pending";
        results?: any[];
        createdAt?: string;
        completedAt?: string;
      }[];
      total?: number;
      page?: number;
      limit?: number;
    };
  }>("/api/materialize-tables/history", {
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
