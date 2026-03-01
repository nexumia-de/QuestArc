/// <reference types="vitest" />
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import { superProductivityPlugin } from "@super-productivity/vite-plugin";

export default defineConfig({
  base: "./",
  plugins: [solidPlugin(), superProductivityPlugin({ inlineAssets: true })],
  build: {
    minify: "terser",
    cssMinify: "lightningcss",
    terserOptions: {
      toplevel: true,
      module: true,
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
        unsafe: true,
        passes: 2,
      },
      format: {
        comments: false,
      },
    },
    target: "esnext",
  },
  test: {
    environment: "jsdom",
    globals: true,
    transformMode: {
      web: [/\.[jt]sx?$/],
    },
  },
  resolve: {
    conditions: ["development", "browser"],
  },
});
