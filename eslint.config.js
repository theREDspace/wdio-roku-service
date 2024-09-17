import eslint from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import importX from 'eslint-plugin-import-x';

export default [
  // Ignored dirs
  {
    ignores: ['**/dist/**/*', '@types/**/*'],
  },
  // All files
  {
    files: ['**/*.{js,mjs,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.es2023,
      },
      parserOptions: {
        ...importX.configs.recommended.parserOptions,
        ecmaVersion: 2023,
      },
    },
    plugins: {
      'import-x': importX,
    },
    rules: {
      ...eslint.configs.recommended.rules,
      ...importX.flatConfigs.recommended.rules,
      'import-x/no-named-as-default': 'off',
      'import-x/no-unresolved': 'off',
    },
    settings: {
      'import-x/ignore': [/@rollup.*/, /shelljs/],
    },
  },
  // Node & Electron main process files and scripts
  {
    files: ['**/*.{js,mjs,ts}'],
    ignores: ['apps/**/src/preload.ts', 'apps/**/src/util.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    settings: {
      ...importX.flatConfigs.electron.settings,
    },
  },
  // Electron renderer process files
  {
    files: ['apps/**/src/preload.ts', 'apps/**/src/util.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      ...importX.flatConfigs.electron.settings,
    },
  },
  // TS files
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { modules: true },
        ecmaVersion: 'latest',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': ts,
      'import-x': importX,
    },
    settings: {
      ...importX.configs.typescript.settings,
    },
    rules: {
      ...ts.configs['eslint-recommended'].rules,
      ...ts.configs.recommended.rules,
      ...importX.flatConfigs.typescript.rules,
      'no-undef': 'off', // redundant - TS will fail to compile with undefined vars
      'no-redeclare': 'off', // redundant - TS will fail to compile with duplicate declarations
      '@typescript-eslint/no-empty-interface': [
        'error',
        {
          allowSingleExtends: true,
        },
      ],
      '@typescript-eslint/no-empty-object-type': [
        'error',
        {
          allowInterfaces: 'with-single-extends',
        },
      ],
      '@typescript-eslint/no-namespace': [
        'error',
        {
          allowDeclarations: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': ['warn'],
    }
  },
  prettier
];