interface LocalAuthTokenPayload {
  authToken?: string | null;
}

const HOMEAI_LOCAL_AUTH_ENDPOINT = '/__homeai_local_auth';

export async function loadHomeAiLocalAuthToken(): Promise<string> {
  try {
    const response = await fetch(HOMEAI_LOCAL_AUTH_ENDPOINT, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!response.ok) {
      return '';
    }
    const payload = (await response.json()) as LocalAuthTokenPayload;
    return typeof payload.authToken === 'string' ? payload.authToken.trim() : '';
  } catch {
    // 生产构建或非 Vite 本地服务没有本地 token 端点，静默回到普通登录流程。
    return '';
  }
}

export async function persistHomeAiLocalAuthToken(token: string): Promise<void> {
  try {
    await fetch(HOMEAI_LOCAL_AUTH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ authToken: token.trim() }),
    });
  } catch {
    // 本地文件写入失败不影响当前浏览器会话，用户仍可通过 sessionStorage 使用 token。
  }
}
