import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { createReplicaTransparentProxyPlugin } from '@wmxs/h5-replica-common/proxy';
import { homeAiReplicaConfig } from './app.config';
import type { Plugin, ViteDevServer } from 'vite';

const HOMEAI_LOCAL_AUTH_ENDPOINT = '/__homeai_local_auth';
const localAuthFilePath = resolve(dirname(fileURLToPath(import.meta.url)), '.homeai-local-auth.json');

function readRequestBody(req: IncomingMessage) {
  return new Promise<string>((resolveBody, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json;charset=utf-8');
  res.end(JSON.stringify(payload));
}

function createHomeAiLocalAuthPlugin(): Plugin {
  return {
    name: 'homeai-local-auth-file',
    configureServer(server) {
      server.middlewares.use(HOMEAI_LOCAL_AUTH_ENDPOINT, async (req, res) => {
        try {
          if (req.method === 'GET') {
            try {
              const raw = await readFile(localAuthFilePath, 'utf8');
              const payload = JSON.parse(raw) as { authToken?: unknown };
              sendJson(res, 200, { authToken: typeof payload.authToken === 'string' ? payload.authToken : '' });
            } catch {
              sendJson(res, 200, { authToken: '' });
            }
            return;
          }

          if (req.method === 'POST') {
            const body = await readRequestBody(req);
            const payload = body ? (JSON.parse(body) as { authToken?: unknown }) : {};
            const authToken = typeof payload.authToken === 'string' ? payload.authToken.trim() : '';
            if (!authToken) {
              await rm(localAuthFilePath, { force: true });
              sendJson(res, 200, { success: true });
              return;
            }
            await mkdir(dirname(localAuthFilePath), { recursive: true });
            // 本地 token 文件只用于个人开发验证，权限尽量收紧，并且路径已加入 .gitignore。
            await writeFile(localAuthFilePath, `${JSON.stringify({ authToken }, null, 2)}\n`, { mode: 0o600 });
            sendJson(res, 200, { success: true });
            return;
          }

          sendJson(res, 405, { success: false, message: 'Method Not Allowed' });
        } catch (error) {
          sendJson(res, 500, { success: false, message: error instanceof Error ? error.message : 'local auth failed' });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    vue(),
    createHomeAiLocalAuthPlugin(),
    createReplicaTransparentProxyPlugin(homeAiReplicaConfig, {
      environmentQueryKey: '__homeai_env',
      targetQueryKey: '__homeai_target',
      maxBodyPreview: 1024 * 1024,
    }),
  ],
});
