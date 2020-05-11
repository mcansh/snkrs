module.exports = {
  extends: ['@mcansh/eslint-config/typescript'],
  rules: {
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '__tests__/**/*',
          'next.config.js',
          'lint-staged.config.js',
        ],
      },
    ],
  },
};
