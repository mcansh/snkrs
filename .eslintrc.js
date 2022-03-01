module.exports = {
  extends: ['@mcansh/eslint-config/typescript', '@remix-run/eslint-config'],
  rules: {
    'prefer-const': 'off',
    'import/no-mutable-exports': 'off',

    // in remix you can throw responses
    '@typescript-eslint/no-throw-literal': 'off',

    // .server.{ts,tsx,js,jsx} and .client.{ts,tsx,js,jsx} are allowed
    'import/extensions': 'off',
  },
};
