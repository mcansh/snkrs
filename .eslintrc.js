module.exports = {
  extends: ['@mcansh/eslint-config/typescript'],
  rules: {
    '@typescript-eslint/no-unsafe-assignment': 'off',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '__tests__/**/*',
          'lint-staged.config.js',
          'postcss.config.js',
          'tailwind.config.js',
          'pm2.config.js',
        ],
      },
    ],
  },
};
