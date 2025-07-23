import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
    // Base JavaScript configuration
    js.configs.recommended,

    // Source TypeScript files configuration (with project reference)
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                project: './tsconfig.json',
                sourceType: 'module',
                ecmaVersion: 'latest',
            },
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                global: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': typescript,
        },
        rules: {
            // TypeScript specific rules
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/ban-types': [
                'error',
                {
                    extendDefaults: true,
                    types: {
                        '{}': false,
                    },
                },
            ],

            // General rules
            'no-console': 'warn',
            'no-debugger': 'error',
            'no-unused-vars': 'off', // Use TypeScript version instead
            'prefer-const': 'error',
            'no-var': 'error',
            'no-async-promise-executor': 'off',
            'no-empty-pattern': 'off',
        },
    },

    // Test TypeScript files configuration (without project reference)
    {
        files: ['tests/**/*.ts'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                sourceType: 'module',
                ecmaVersion: 'latest',
            },
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                global: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                describe: 'readonly',
                it: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                jest: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': typescript,
        },
        rules: {
            // TypeScript specific rules
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',

            // General rules
            'no-console': 'warn',
            'no-debugger': 'error',
            'no-unused-vars': 'off', // Use TypeScript version instead
            'prefer-const': 'error',
            'no-var': 'error',
        },
    },

    // Configuration files
    {
        files: ['*.js', '*.mjs', '*.cjs'],
        languageOptions: {
            sourceType: 'module',
            ecmaVersion: 'latest',
        },
        rules: {
            'no-unused-vars': 'error',
            'prefer-const': 'error',
            'no-var': 'error',
        },
    },

    // Ignore patterns
    {
        ignores: [
            'lib/**',
            'node_modules/**',
            'dist/**',
            'build/**',
            'coverage/**',
            '*.min.js',
        ],
    },
];
