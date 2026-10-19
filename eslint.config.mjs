import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Next 16 ships its ESLint config as native flat config, so there is
 * no FlatCompat shim. `npm run lint` runs this.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Client-only state (saved places, home airport) is read from
      // localStorage after mount, which this rule flags.
      "react-hooks/set-state-in-effect": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  globalIgnores([".next/**", "node_modules/**", "out/**", "public/**", "next-env.d.ts", "scripts/**"]),
]);

export default eslintConfig;
