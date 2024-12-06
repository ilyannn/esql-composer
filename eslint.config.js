import reactCompiler from 'eslint-plugin-react-compiler'

export default [
    {
        plugins: {
            'react-compiler': reactCompiler,
        },
        rules: {
            'react-compiler/react-compiler': 'error',
        },
        env: {
            browser: true,
            es2021: true,
            node: true,
        },
        extends: ['eslint:recommended', "react-app",
            "react-app/jest", 'plugin:prettier/recommended', 'airbnb-base'],
        parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
        rules: {
            'no-console': 'error',
            'no-debugger': 'error',
            'no-unused-vars': 'error',
            'eqeqeq': ['error', 'always'],
            'curly': 'error',
            'strict': ['error', 'global'],
            'no-var': 'error',
            'prefer-const': 'error',
            'no-implicit-globals': 'error',
            'no-implied-eval': 'error',
            'no-iterator': 'error',
            'no-alert': 'error',
            'no-eval': 'error',
            'no-empty-function': 'error',
            'no-extra-bind': 'error',
            'require-await': 'error',
            'no-return-await': 'error',
            'no-shadow': 'error',
            'no-use-before-define': 'error',
            'prefer-template': 'error',
            'object-shorthand': 'error',
            'prefer-arrow-callback': 'error',
        },
    }
];