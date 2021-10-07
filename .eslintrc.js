module.exports = {
  extends: ['@mcansh/eslint-config/typescript'],
  rules: {
    '@typescript-eslint/no-unsafe-assignment': 'off',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '__tests__/**/*',
          '.eslintrc.js',
          'lint-staged.config.js',
          'pm2.config.js',
          'postcss.config.js',
          'prettier.config.js',
          'scripts/heroicon-symbols.mjs',
          'tailwind.config.js',
        ],
      },
    ],
  },
};
