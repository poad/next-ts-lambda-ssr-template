// @ts-check

import eslint from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';

import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '*.d.ts',
      '*.{js,jsx}',
      'src/tsconfig.json',
      'src/stories',
      '*.css',
      'node_modules/**/*',
      '.next',
      'out',
      '.storybook',
      'cdk.out',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}', '{bin,lib}/*.ts'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    extends: [
      ...tseslint.configs.recommended,
    ],
    settings: {
      'import/internal-regex': '^~/',
      'import/resolver': {
        node: {
          extensions: ['.ts', '.tsx'],
        },
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
  },
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    // @ts-ignore
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@next/next/no-duplicate-head': 'off',
      '@next/next/no-img-element': 'error',
      '@next/next/no-page-custom-font': 'off',
      ...prettier.rules,
      'react/display-name': 'off',
      'import/namespace': 'off',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
    },
  },
);
