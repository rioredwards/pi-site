import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Allow explicit any types in TypeScript (common in personal projects)
      "@typescript-eslint/no-explicit-any": "off",
      // Allow img elements (common in personal projects)
      "@next/next/no-img-element": "off",
      // Allow console statements in development
      "no-console": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
    "cache-handler.mjs",
    "server.js",
    "system-profiler/**",
    "components/pi-model-3d.tsx", // Three.js code uses patterns incompatible with React Compiler
    "components/pi-model-canvas.tsx", // Three.js Canvas wrapper
  ]),
]);

export default eslintConfig;
