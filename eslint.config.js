import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/', 'packages/sp-plugin-api/src/'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['**/*.mjs', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    // The engine is pure: no clock, no machine time zone, no logging, no
    // host globals (docs/architecture.md). Time comes in as input.
    files: ['packages/engine/src/**/*.ts'],
    rules: {
      'no-console': 'error',
      'no-restricted-globals': ['error', 'window', 'document', 'process', 'PluginAPI'],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'The engine gets the time as input.',
        },
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'The engine gets the time as input.',
        },
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message: 'The engine is deterministic.',
        },
      ],
    },
  },
);
