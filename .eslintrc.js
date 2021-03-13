const path = require('path');

module.exports = {
  extends: ['@mcansh/eslint-config/typescript'],
  parserOptions: {
    project: [path.join(process.cwd(), 'app/tsconfig.json')],
  },
  rules: {
    'import/order': [
      'error',
      {
        pathGroups: [
          {
            pattern: 'img:*',
            group: 'internal',
          },
          {
            pattern: 'url:*',
            group: 'internal',
          },
          {
            pattern: 'css:*',
            group: 'internal',
          },
        ],
      },
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '__tests__/**/*',
          'lint-staged.config.js',
          'postcss.config.js',
          'tailwind.config.js',
        ],
      },
    ],
  },
};
