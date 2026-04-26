// frontend/eslint.config.js
// ESLint temporarily disabled for MVP - TypeScript provides type checking
// Enable with proper config before production:
// 1. Install: npm install -D eslint-plugin-react eslint-plugin-react-hooks
// 2. Configure tseslint with project: true
// 3. Add rules for React hooks and TypeScript best practices

import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist/**/*', 'node_modules/**/*'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      // Disabled for MVP speed
    },
  }
)
