// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取AI配置列表 GET /api/ai-configs */
export async function getAiConfigs(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getAiConfigsParams,
  options?: { [key: string]: any }
) {
  return request<
    {
      id?: string;
      provider?: string;
      apiUrl?: string;
      model?: string;
      config?: Record<string, any>;
      createdAt?: string;
      updatedAt?: string;
    }[]
  >("/api/ai-configs", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 创建AI配置 POST /api/ai-configs */
export async function postAiConfigs(
  body: {
    /** AI服务提供商 */
    provider: string;
    /** API地址 */
    apiUrl: string;
    /** API密钥 */
    apiKey: string;
    /** AI模型名称 */
    model: string;
    /** 额外配置参数 */
    config?: Record<string, any>;
  },
  options?: { [key: string]: any }
) {
  return request<{
    id?: string;
    provider?: string;
    apiUrl?: string;
    model?: string;
    config?: Record<string, any>;
    createdAt?: string;
    updatedAt?: string;
  }>("/api/ai-configs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 根据ID获取AI配置 GET /api/ai-configs/${param0} */
export async function getAiConfigsId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getAiConfigsIdParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    id?: string;
    provider?: string;
    apiUrl?: string;
    apiKey?: string;
    model?: string;
    config?: Record<string, any>;
    createdAt?: string;
    updatedAt?: string;
  }>(`/api/ai-configs/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 更新AI配置 PUT /api/ai-configs/${param0} */
export async function putAiConfigsId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putAiConfigsIdParams,
  body: {
    /** AI服务提供商 */
    provider?: string;
    /** API地址 */
    apiUrl?: string;
    /** API密钥 */
    apiKey?: string;
    /** AI模型名称 */
    model?: string;
    /** 额外配置参数 */
    config?: Record<string, any>;
  },
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    id?: string;
    provider?: string;
    apiUrl?: string;
    apiKey?: string;
    model?: string;
    config?: Record<string, any>;
    createdAt?: string;
    updatedAt?: string;
  }>(`/api/ai-configs/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 删除AI配置 DELETE /api/ai-configs/${param0} */
export async function deleteAiConfigsId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteAiConfigsIdParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/ai-configs/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 测试AI配置连接 POST /api/ai-configs/${param0}/test */
export async function postAiConfigsIdTest(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postAiConfigsIdTestParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    success?: boolean;
    message?: string;
    provider?: string;
    model?: string;
  }>(`/api/ai-configs/${param0}/test`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 根据提供商和模型获取AI配置 GET /api/ai-configs/provider/${param0}/model/${param1} */
export async function getAiConfigsProviderProviderModelModel(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getAiConfigsProviderProviderModelModelParams,
  options?: { [key: string]: any }
) {
  const { provider: param0, model: param1, ...queryParams } = params;
  return request<{
    id?: string;
    provider?: string;
    apiUrl?: string;
    apiKey?: string;
    model?: string;
    config?: Record<string, any>;
    createdAt?: string;
    updatedAt?: string;
  }>(`/api/ai-configs/provider/${param0}/model/${param1}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}
