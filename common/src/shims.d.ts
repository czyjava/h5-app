declare module 'node:buffer' {
  export const Buffer: any;
  export type Buffer = any;
}

declare module 'node:crypto' {
  export function createHash(algorithm: string): any;
  export function randomUUID(): string;
}

declare module 'node:zlib' {
  export function gzipSync(input: unknown): { toString(encoding?: string): string };
}

declare module 'node:http' {
  export type IncomingHttpHeaders = Record<string, string | string[] | undefined>;
  export type IncomingMessage = any;
  export type ServerResponse = any;
}

declare module 'vite' {
  export interface ViteDevServer {
    middlewares: {
      use(handler: (req: any, res: any, next: () => void) => void): void;
    };
  }

  export interface Plugin {
    name: string;
    configureServer?: (server: ViteDevServer) => void;
  }
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}
