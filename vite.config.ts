/// <reference types="vitest" />
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { superProductivityPlugin } from '@super-productivity/vite-plugin';

export default defineConfig({
  plugins: [solidPlugin(), superProductivityPlugin()],
  build: {
    minify: true,
    target: 'es2020',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    transformMode: {
      web: [/\.[jt]sx?$/],
    },
  },
  resolve: {
    conditions: ['development', 'browser'],
  },
});
