let {
  jsxBracketSameLine,
  ...config
} = require('@mcansh/eslint-config/prettier.config');

module.exports = {
  ...config,
  bracketSameLine: false,
};
