export const DEFAULT_SENSITIVE_KEY_PATTERN =
  /(^|[-_])(authorization|cookie|set-cookie|token|authtoken|password|passwd|secret|key|phone|mobile|idcard|smsid|smscode|necaptchavalidate)([-_]|$)/i;

export function isSensitiveKey(key: string, pattern = DEFAULT_SENSITIVE_KEY_PATTERN) {
  return pattern.test(key);
}

export function redactText(value: string) {
  return value
    .replace(/(authToken=)[^&\s]+/gi, '$1已脱敏')
    .replace(/(token=)[^&\s]+/gi, '$1已脱敏')
    .replace(/(password=)[^&\s]+/gi, '$1已脱敏')
    .replace(/(phoneNumber=)[^&\s]+/gi, '$1已脱敏')
    .replace(/(smsId=)[^&\s]+/gi, '$1已脱敏')
    .replace(/(smsCode=)[^&\s]+/gi, '$1已脱敏')
    .replace(/(NECaptchaValidate=)[^&\s]+/gi, '$1已脱敏')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer 已脱敏')
    .replace(/1[3-9]\d{9}/g, '手机号已脱敏');
}

export function redactValue(key: string, value: unknown): unknown {
  if (isSensitiveKey(key)) {
    return '已脱敏';
  }
  if (typeof value === 'string') {
    return redactText(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(key, item));
  }
  if (value && typeof value === 'object') {
    return redactObject(value as Record<string, unknown>);
  }
  return value;
}

export function redactObject(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, redactValue(key, value)]));
}

function flattenHeaderValue(value: unknown) {
  if (!value) {
    return '';
  }
  return Array.isArray(value) ? value.join(', ') : String(value);
}

export function redactHeaders(headers: Record<string, unknown> | Headers) {
  const entries: [string, string][] = [];
  if (headers instanceof Headers) {
    headers.forEach((value, key) => entries.push([key, value]));
  } else {
    Object.entries(headers).forEach(([key, value]) => entries.push([key, flattenHeaderValue(value)]));
  }
  return Object.fromEntries(entries.map(([key, value]) => [key, String(redactValue(key, value))]));
}

export function redactUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    for (const key of Array.from(url.searchParams.keys())) {
      if (isSensitiveKey(key)) {
        url.searchParams.set(key, '已脱敏');
      }
    }
    return redactText(url.toString());
  } catch {
    return redactText(rawUrl);
  }
}
