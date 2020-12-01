const defaultConfig = require('tailwindcss/defaultConfig');
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  future: 'all',
  experimental: 'all',
  purge: {
    content: ['./app/**/*.{js,ts,tsx,md,mdx}', './remix.config.js'],
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      },
      inset: {
        '1/2': '50%',
      },
    },
  },
  variants: {
    backgroundColor: [...defaultConfig.variants.borderColor, 'disabled'],
    borderColor: [...defaultConfig.variants.borderColor, 'focus-within'],
    opacity: [...defaultConfig.variants.opacity, 'disabled'],
    cursor: [...defaultConfig.variants.cursor, 'disabled'],
  },
  plugins: [],
};
