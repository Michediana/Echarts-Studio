import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "node_modules",
      "src-tauri",
      // shadcn-generated primitives are treated as vendored code.
      "src/components/ui/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      // The two classic, stable hooks rules. The React-Compiler-preview rules
      // bundled in the plugin's `recommended` set (e.g. set-state-in-effect)
      // flag idiomatic external-sync effects throughout the existing codebase
      // and are intentionally left out of this baseline.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Some escapes are intentional (e.g. the `<\/script>` guard in the HTML
      // export template); keep this advisory rather than blocking.
      "no-useless-escape": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
