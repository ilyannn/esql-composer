// @ts-check

import eslint from "@eslint/js";
import globals from "globals";
import reactPlugin from "eslint-plugin-react";
import reactCompiler from "eslint-plugin-react-compiler";
import tseslint from "typescript-eslint";

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  reactPlugin.configs.flat?.recommended,
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    plugins: {
      react: reactPlugin,
      "react-compiler": reactCompiler,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: {
          jsx: true,
        },
      },
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    rules: {
      // Rules set to "off"
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "no-console": "off",

      // Rules set to "warn"
      "react/display-name": "warn",
      "no-case-declarations": "warn",
      "no-var": "warn",
      "no-unused-vars": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "prefer-const": "warn",
      "no-shadow": "warn",
      "@typescript-eslint/no-explicit-any": "warn",

      // Rules set to "error"
      "react-compiler/react-compiler": "error",
      "no-debugger": "error",
      eqeqeq: ["error", "always"],
      curly: "error",
      strict: ["error", "global"],
      "no-implicit-globals": "error",
      "no-implied-eval": "error",
      "no-iterator": "error",
      "no-alert": "error",
      "no-eval": "error",
      "no-empty-function": "error",
      "no-extra-bind": "error",
      "require-await": "error",
      "no-return-await": "error",
      "no-use-before-define": "error",
      "prefer-template": "error",
      "object-shorthand": "error",
      "prefer-arrow-callback": "error",
    },
  },
];
