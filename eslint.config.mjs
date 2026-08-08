import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import security from "eslint-plugin-security";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { security },
    rules: {
      "security/detect-object-injection": "off",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Existing components predate the React Compiler lint rules. Keep the
      // findings visible while allowing the CI baseline to pass incrementally.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "app/generated/**",
    ".cursor/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
