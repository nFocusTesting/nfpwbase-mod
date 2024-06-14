// @ts-check

import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["**/*.js"],
    ignores: ["node_modules/", "nfpwbase/"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ["**/*.ts"],
    ignores: ["node_modules/", "nfpwbase/"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
      globals: { ...globals.node },
    },
    rules: {
      "@/no-restricted-exports": [
        "error",
        { restrictDefaultExports: { direct: true } },
      ],
      "@typescript-eslint/no-floating-promises": ["error"],
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-base-to-string": [
        "warn",
        { ignoredTypeNames: ["Locator", "Date"] },
      ],
    },
  }
);
