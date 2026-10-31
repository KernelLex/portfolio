import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Phaser, the street scene and the browser shell are all reached through
// dynamic import(), so the bundler splits them out on its own - the first
// frame never waits on the game engine.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
