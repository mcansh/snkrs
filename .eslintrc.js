const path = require('path');

module.exports = {
  extends: ['@mcansh/eslint-config/typescript'],
  parserOptions: {
    project: [
      path.join(process.cwd(), 'app/tsconfig.json'),
      path.join(process.cwd(), 'data/tsconfig.json'),
      path.join(process.cwd(), '@types/tsconfig.json'),
    ],
  },
  rules: {
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '__tests__/**/*',
          'next.config.js',
          'lint-staged.config.js',
          'tailwind.config.js',
          'postcss.config.js',
        ],
      },
    ],
  },
};
