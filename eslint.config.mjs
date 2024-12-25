import eslint from "@eslint/js";
import rxjs from "@smarttools/eslint-plugin-rxjs";
import prettier from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      parserOptions: { project: ["./tsconfig.json"] },
    },
    plugins: { rxjs },
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-duplicate-enum-values": "error",
      "@typescript-eslint/no-explicit-any": 1,
      "@typescript-eslint/no-inferrable-types": [
        "warn",
        {
          ignoreParameters: true,
        },
      ],
      "@typescript-eslint/no-unsafe-declaration-merging": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      quotes: ["error", "double"],
      "rxjs/no-async-subscribe": "error",
      "rxjs/no-ignored-observable": "error",
      "rxjs/no-ignored-subscription": "error",
      "rxjs/no-unbound-methods": "error",
      "rxjs/throw-error": "error",
      semi: ["error", "always"],
      strict: "error",
    },
  },
  {
    ignores: [
      "node_modules/*",
      "build/*",
      "dist/*",
      "**/*.spec.ts",
      "*.config.mjs",
      "jest.config.js",
      "**/*.test.ts",
    ],
  },
);
