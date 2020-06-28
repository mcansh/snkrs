module.exports = {
  extends: ['@mcansh/eslint-config/typescript'],
  rules: {
    '@next/next/no-html-link-for-pages': ['warn', 'src/pages'],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '__tests__/**/*',
          'next.config.js',
          'lint-staged.config.js',
          'tailwind.config.js',
        ],
      },
    ],
  },
};
