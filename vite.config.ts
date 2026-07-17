import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base: './' — собранная статика работает и на GitHub Pages, и на Vercel
export default defineConfig({
  plugins: [react()],
  base: './',
  // host явно: без него dev-сервер на Windows слушает только IPv6-локалхост
  // и не открывается по http://127.0.0.1:5173
  server: { host: '127.0.0.1' },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/model/**/*.ts'],
      thresholds: { lines: 75, functions: 75, branches: 75, statements: 75 },
    },
  },
});
