import { defineConfig } from 'vite';

export default defineConfig({ base: './', build:{rollupOptions:{input:{journey:'index.html',results:'resultados/index.html'}}} });
