import js from '@eslint/js';
import json from '@eslint/json';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';
import minecraftLinting from 'eslint-plugin-minecraft-linting';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import tseslint from 'typescript-eslint';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  {
    ignores: [
      'node_modules/**',
      '**/*.generated.*', // Filter-generated files (i18n bundle + declarations)
      'packs/data/generated/**', // Minecraft schema types (generator filter)
      '.*/**',
      '**/*.*js',
      'filters/**',
      'build/**',
    ],
  },

  {
    files: ['**/*.json', '**/*.jsonc'],
    plugins: { json },
    language: 'json/jsonc',
    extends: ['json/recommended'],
  },

  // Stylistic configuration factory (only for JS/TS files)
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    ...stylistic.configs.customize({
      indent: 2,
      quotes: 'single',
      semi: true,
      jsx: true,
      braceStyle: '1tbs',
    }),
  },

  // Global padding rules (only for JS/TS files)
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    rules: {
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
        { blankLine: 'any', prev: ['case', 'default'], next: 'break' },
        { blankLine: 'any', prev: 'case', next: 'case' },
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: 'block', next: '*' },
        { blankLine: 'always', prev: '*', next: 'block' },
        { blankLine: 'always', prev: 'block-like', next: '*' },
        { blankLine: 'always', prev: '*', next: 'block-like' },
        { blankLine: 'always', prev: ['import'], next: ['const', 'let', 'var'] },
      ],
    },
  },

  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['**/*.d.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    plugins: {
      '@minecraft': minecraftLinting,
    },
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'always' }],
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
      '@typescript-eslint/no-unsafe-type-assertion': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-wrapper-object-types': 'error',
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-expect-error': 'allow-with-description' }],
      '@typescript-eslint/consistent-type-assertions': 'error',
      '@typescript-eslint/dot-notation': 'error',
      '@typescript-eslint/member-ordering': [
        'error',
        {
          default: [
            'private-field',
            'protected-field',
            'public-field',
            'constructor',
            'public-method',
            'protected-method',
            'private-method',
          ],
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'] },
        { selector: 'default', modifiers: ['unused'], filter: { regex: '^(_|_.*_?)$', match: true }, format: null },
        { selector: 'variable', format: ['camelCase'] },
        { selector: 'variable', modifiers: ['const'], format: ['camelCase', 'UPPER_CASE', 'PascalCase'] },
        { selector: ['enum', 'enumMember', 'function'], format: ['camelCase', 'UPPER_CASE', 'PascalCase'] },
        { selector: ['property', 'parameterProperty', 'accessor'], modifiers: ['private'], format: ['camelCase'], leadingUnderscore: 'require' },
        { selector: ['property', 'parameterProperty', 'accessor'], modifiers: ['private', 'readonly'], format: ['UPPER_CASE', 'camelCase'], leadingUnderscore: 'allow' },
        { selector: ['property'], modifiers: ['readonly'], format: ['camelCase', 'UPPER_CASE'] },
        { selector: ['objectLiteralProperty', 'typeProperty'], format: ['camelCase', 'snake_case', 'UPPER_CASE', 'PascalCase'], leadingUnderscore: 'allowDouble' },
        // Namespaced Minecraft JSON keys ("minecraft:physics", "bt:gc.graves") in generator templates
        { selector: ['objectLiteralProperty', 'typeProperty'], modifiers: ['requiresQuotes'], format: null },
        // Config group metadata keys ($label, $description)
        { selector: ['objectLiteralProperty', 'typeProperty'], filter: { regex: '^\\$[a-z][a-zA-Z0-9]*$', match: true }, format: null },
        // i18n plural leaves: camelCase base + CLDR category suffix (stock_one, keyGiven_other)
        { selector: ['objectLiteralProperty', 'typeProperty'], filter: { regex: '^[a-z][a-zA-Z0-9]*_(zero|one|two|few|many|other)$', match: true }, format: null },
        { selector: 'typeLike', format: ['PascalCase'] },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^(_|_.*_?)$' }],
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/unbound-method': ['error', { ignoreStatic: true }],
      // @stylistic
      '@stylistic/jsx-curly-brace-presence': ['warn', 'always'],
      // eslint
      'arrow-body-style': ['error', 'as-needed'],
      'curly': 'warn',
      'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
      'prefer-const': 'warn',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'object-shorthand': 'error',
      // Minecraft
      '@minecraft/avoid-unnecessary-command': 'error',
    },
  },
]);
