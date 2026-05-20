export function compactNumber(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }
  return String(value);
}

export function maskToken(token: string): string {
  if (!token) {
    return '未设置';
  }
  if (token.length <= 8) {
    return '已设置';
  }
  return `${token.slice(0, 4)}****${token.slice(-4)}`;
}

export function wait(ms = 260): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
