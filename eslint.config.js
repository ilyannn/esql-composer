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
    // extends: [
    //   "react-app",
    //   "react-app/jest",
    //   "plugin:prettier/recommended",
    //   "airbnb-base",
    // ],
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
        //        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      "react-compiler/react-compiler": "error",
      "no-console": "error",
      "no-debugger": "error",
      "no-unused-vars": "error",
      eqeqeq: ["error", "always"],
      curly: "error",
      strict: ["error", "global"],
      "no-var": "error",
      "prefer-const": "error",
      "no-implicit-globals": "error",
      "no-implied-eval": "error",
      "no-iterator": "error",
      "no-alert": "error",
      "no-eval": "error",
      "no-empty-function": "error",
      "no-extra-bind": "error",
      "require-await": "error",
      "no-return-await": "error",
      "no-shadow": "error",
      "no-use-before-define": "error",
      "prefer-template": "error",
      "object-shorthand": "error",
      "prefer-arrow-callback": "error",
    },
  },
];
