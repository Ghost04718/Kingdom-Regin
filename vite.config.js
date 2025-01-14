import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  env: loadEnv(process.cwd(), ''),
  plugins: [react()],
})
