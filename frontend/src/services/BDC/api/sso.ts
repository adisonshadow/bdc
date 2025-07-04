// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** SSO回调页面 GET方法访问SSO回调页面时的友好提示 GET /sso-callback */
export async function getSsoCallback(options?: { [key: string]: any }) {
  return request<any>("/sso-callback", {
    method: "GET",
    ...(options || {}),
  });
}

/** SSO认证回调 处理第三方SSO服务器的认证回调 POST /sso-callback */
export async function postSsoCallback(
  body: {
    /** 身份提供者标识 */
    idp: string;
    /** 访问令牌 */
    access_token: string;
    /** 刷新令牌 */
    refresh_token: string;
    /** 令牌类型 */
    token_type: string;
    /** 过期时间 */
    expires_in: string;
    /** 状态参数 */
    state?: string;
    /** 用户信息 */
    user_info: string;
  },
  options?: { [key: string]: any }
) {
  return request<any>("/sso-callback", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: body,
    ...(options || {}),
  });
}
