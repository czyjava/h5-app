export interface ReplicaJsonBodyParseResult {
  parsed: boolean;
  value: unknown;
  repaired: boolean;
}

const BARE_REDACTED_VALUE_PATTERN = /([:[,]\s*)(手机号已脱敏[^\s,\]}]*|已脱敏)(\s*)(?=[,\]}])/g;

function quoteBareRedactedValues(text: string) {
  return text.replace(BARE_REDACTED_VALUE_PATTERN, (_match, prefix: string, value: string, suffix: string) => {
    return `${prefix}${JSON.stringify(value)}${suffix}`;
  });
}

export function parseReplicaJsonBody(body: string): ReplicaJsonBodyParseResult {
  const text = body.trim();
  if (!text) {
    return { parsed: false, value: null, repaired: false };
  }

  try {
    return { parsed: true, value: JSON.parse(text) as unknown, repaired: false };
  } catch {
    const repairedText = quoteBareRedactedValues(text);
    if (repairedText === text) {
      return { parsed: false, value: null, repaired: false };
    }
    try {
      // 兼容旧代理事件里“裸脱敏占位符”导致的非法 JSON，让历史请求也能树形展开。
      return { parsed: true, value: JSON.parse(repairedText) as unknown, repaired: true };
    } catch {
      return { parsed: false, value: null, repaired: false };
    }
  }
}
