import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import solid from 'eslint-plugin-solid';
import eslintConfigPrettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default tseslint.config(
    { ignores: ['dist', 'coverage', 'node_modules', 'public'] },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parserOptions: {
                sourceType: 'module',
            },
        },
        plugins: {
            solid: solid,
            prettier: prettierPlugin,
        },
        rules: {
            ...solid.configs.typescript.rules,
            'prettier/prettier': 'warn',
        },
    },
    eslintConfigPrettier
);
