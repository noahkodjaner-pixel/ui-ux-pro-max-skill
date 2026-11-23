import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' : le build fonctionne aussi bien à la racine d'un domaine que dans un sous-dossier.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { target: 'es2020' },
});
