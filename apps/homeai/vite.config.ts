import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { createReplicaTransparentProxyPlugin } from '@wmxs/h5-replica-common/proxy';
import { homeAiReplicaConfig } from './app.config';

export default defineConfig({
  plugins: [
    vue(),
    createReplicaTransparentProxyPlugin(homeAiReplicaConfig, {
      environmentQueryKey: '__homeai_env',
      maxBodyPreview: 1024 * 1024,
    }),
  ],
});
