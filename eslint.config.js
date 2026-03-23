// @ts-check

import eslint from "@eslint/js";
import globals from "globals";
import reactPlugin from "eslint-plugin-react";
import reactCompiler from "eslint-plugin-react-compiler";
import tseslint from "typescript-eslint";

export default [
  {
    settings: {
      react: {
        version: "detect",
      },
    },
  },
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
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // Rules set to "off"
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/display-name": "off",
      "no-console": "off",
      "no-case-declarations": "off",
      "no-unused-vars": "off",
      "no-shadow": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "require-await": "off",
      "no-return-await": "off",
      "no-use-before-define": "off",

      // Rules set to "warn"
      "no-var": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "prefer-const": "warn",

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
      "prefer-template": "error",
      "object-shorthand": "error",
      "prefer-arrow-callback": "error",
    },
  },
];
