declare const _default: (
    | {
          readonly rules: Readonly<import('eslint').Linter.RulesRecord>;
      }
    | {
          files: string[];
          languageOptions: {
              parser: any;
              parserOptions: {
                  project: string;
                  sourceType: string;
                  ecmaVersion: string;
              };
              globals: {
                  console: string;
                  process: string;
                  Buffer: string;
                  __dirname: string;
                  __filename: string;
                  global: string;
                  module: string;
                  require: string;
                  exports: string;
                  setTimeout: string;
                  clearTimeout: string;
                  setInterval: string;
                  clearInterval: string;
                  describe?: undefined;
                  it?: undefined;
                  test?: undefined;
                  expect?: undefined;
                  beforeEach?: undefined;
                  afterEach?: undefined;
                  beforeAll?: undefined;
                  afterAll?: undefined;
                  jest?: undefined;
              };
              sourceType?: undefined;
              ecmaVersion?: undefined;
          };
          plugins: {
              '@typescript-eslint': {
                  configs: Record<string, ClassicConfig.Config>;
                  meta: FlatConfig.PluginMeta;
                  rules: import('@typescript-eslint/eslint-plugin/rules').TypeScriptESLintRules;
              };
          };
          rules: {
              '@typescript-eslint/no-unused-vars': (
                  | string
                  | {
                        argsIgnorePattern: string;
                        varsIgnorePattern: string;
                    }
              )[];
              '@typescript-eslint/no-explicit-any': string;
              '@typescript-eslint/explicit-function-return-type': string;
              '@typescript-eslint/explicit-module-boundary-types': string;
              '@typescript-eslint/ban-types': (
                  | string
                  | {
                        extendDefaults: boolean;
                        types: {
                            '{}': boolean;
                        };
                    }
              )[];
              'no-console': string;
              'no-debugger': string;
              'no-unused-vars': string;
              'prefer-const': string;
              'no-var': string;
              'no-async-promise-executor': string;
              'no-empty-pattern': string;
          };
          ignores?: undefined;
      }
    | {
          files: string[];
          languageOptions: {
              parser: any;
              parserOptions: {
                  sourceType: string;
                  ecmaVersion: string;
                  project?: undefined;
              };
              globals: {
                  console: string;
                  process: string;
                  Buffer: string;
                  __dirname: string;
                  __filename: string;
                  global: string;
                  module: string;
                  require: string;
                  exports: string;
                  setTimeout: string;
                  clearTimeout: string;
                  setInterval: string;
                  clearInterval: string;
                  describe: string;
                  it: string;
                  test: string;
                  expect: string;
                  beforeEach: string;
                  afterEach: string;
                  beforeAll: string;
                  afterAll: string;
                  jest: string;
              };
              sourceType?: undefined;
              ecmaVersion?: undefined;
          };
          plugins: {
              '@typescript-eslint': {
                  configs: Record<string, ClassicConfig.Config>;
                  meta: FlatConfig.PluginMeta;
                  rules: import('@typescript-eslint/eslint-plugin/rules').TypeScriptESLintRules;
              };
          };
          rules: {
              '@typescript-eslint/no-unused-vars': (
                  | string
                  | {
                        argsIgnorePattern: string;
                        varsIgnorePattern: string;
                    }
              )[];
              '@typescript-eslint/no-explicit-any': string;
              '@typescript-eslint/explicit-function-return-type': string;
              '@typescript-eslint/explicit-module-boundary-types': string;
              'no-console': string;
              'no-debugger': string;
              'no-unused-vars': string;
              'prefer-const': string;
              'no-var': string;
              '@typescript-eslint/ban-types'?: undefined;
              'no-async-promise-executor'?: undefined;
              'no-empty-pattern'?: undefined;
          };
          ignores?: undefined;
      }
    | {
          files: string[];
          languageOptions: {
              sourceType: string;
              ecmaVersion: string;
              parser?: undefined;
              parserOptions?: undefined;
              globals?: undefined;
          };
          rules: {
              'no-unused-vars': string;
              'prefer-const': string;
              'no-var': string;
              '@typescript-eslint/no-unused-vars'?: undefined;
              '@typescript-eslint/no-explicit-any'?: undefined;
              '@typescript-eslint/explicit-function-return-type'?: undefined;
              '@typescript-eslint/explicit-module-boundary-types'?: undefined;
              '@typescript-eslint/ban-types'?: undefined;
              'no-console'?: undefined;
              'no-debugger'?: undefined;
              'no-async-promise-executor'?: undefined;
              'no-empty-pattern'?: undefined;
          };
          plugins?: undefined;
          ignores?: undefined;
      }
    | {
          ignores: string[];
          files?: undefined;
          languageOptions?: undefined;
          plugins?: undefined;
          rules?: undefined;
      }
)[];
export default _default;
