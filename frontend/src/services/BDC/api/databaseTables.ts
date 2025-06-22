// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取数据库表结构 获取指定数据库连接的表结构信息 GET /api/database-connections/${param0}/tables */
export async function getDatabaseTables(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDatabaseTablesParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    success?: boolean;
    data?: API.DatabaseTable[];
  }>(`/api/database-connections/${param0}/tables`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
} 