import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

// 테스트는 순수 로직(lib)만 다루므로 PWA·Tailwind 플러그인 없이 돌린다.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
