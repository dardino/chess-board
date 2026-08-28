/* eslint-disable @typescript-eslint/no-explicit-any */
import css from "@eslint/css";
import js from "@eslint/js";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: [
      "github-pages",
      "coverage",
      "dist/**",
      "node_modules/**",
      "*.min.js",
      "*.map"
    ]
  },
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { js },
    extends: ["js/recommended", tseslint.configs.recommended], 
    languageOptions: { 
      globals: {...globals.browser, ...globals.node},
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      }
    } 
  },
  { files: ["**/*.json"], plugins: { json: json as any }, language: "json/json", extends: ["json/recommended"] },
  { files: ["**/*.jsonc"], plugins: { json: json as any }, language: "json/jsonc", extends: ["json/recommended"] },
  { files: ["**/*.json5"], plugins: { json: json as any }, language: "json/json5", extends: ["json/recommended"] },
  { files: ["**/*.md"], plugins: { markdown }, language: "markdown/commonmark", extends: ["markdown/recommended"] },
  { files: ["**/*.css"], plugins: { css: css as any }, language: "css/css", extends: ["css/recommended"],
    rules: {
      "css/use-baseline": ["error", { available: 2026, allowProperties: ["user-select"] }],
    } 
  },
]);
