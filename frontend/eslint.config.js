import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // dev-dist は vite-plugin-pwa が生成する Service Worker。検査対象にしない
  globalIgnores(['dist', 'dev-dist']),
  {
    // src/ は全て .ts / .tsx。ここを外すと実質的な検査対象が無くなる
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // 型情報は tsc が見る。ESLint 側は tsc が拾わないものに絞る
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' },
      ],
      // shadcn/ui はコンポーネントと variants を同居させる。HMR の最適化に関する
      // 助言であって不具合ではないため、ファイル分割を強制せず警告に留める
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    // 設定ファイル類は Node 環境
    files: ['*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
])
