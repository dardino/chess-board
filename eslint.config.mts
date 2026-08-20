/* eslint-disable @typescript-eslint/no-explicit-any */
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "*.min.js",
      "*.map"
    ]
  },
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: {...globals.browser, ...globals.node} } },
  tseslint.configs.recommended,
  { files: ["**/*.json"], plugins: { json: json as any }, language: "json/json", extends: ["json/recommended"] },
  { files: ["**/*.jsonc"], plugins: { json: json as any }, language: "json/jsonc", extends: ["json/recommended"] },
  { files: ["**/*.json5"], plugins: { json: json as any }, language: "json/json5", extends: ["json/recommended"] },
  { files: ["**/*.md"], plugins: { markdown }, language: "markdown/commonmark", extends: ["markdown/recommended"] },
  { files: ["**/*.css"], plugins: { css: css as any }, language: "css/css", extends: ["css/recommended"] },
]);
