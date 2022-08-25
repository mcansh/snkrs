module.exports = {
  extends: ['@mcansh/eslint-config/typescript', '@remix-run/eslint-config'],
  rules: {
    'prefer-const': 'off',
    'import/no-mutable-exports': 'off',

    // in remix you can throw responses
    '@typescript-eslint/no-throw-literal': 'off',

    // .server.{ts,tsx,js,jsx} and .client.{ts,tsx,js,jsx} are allowed
    'import/extensions': 'off',

    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',

    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          'lint-staged.config.js',
          'pm2.config.js',
          'postcss.config.js',
          'prettier.config.js',
          'remix.config.js',
          'tailwind.config.js',
          'scripts/heroicon-symbols.mjs',
        ],
      },
    ],
  },
};
