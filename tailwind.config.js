const defaultConfig = require('tailwindcss/defaultConfig');
const defaultTheme = require('tailwindcss/defaultTheme');
const plugin = require('tailwindcss/plugin');

module.exports = {
  mode: 'jit',
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
      screens: {
        xs: '475px',
      },
    },
  },
  variants: {
    backgroundColor: [...defaultConfig.variants.borderColor, 'disabled'],
    borderColor: [...defaultConfig.variants.borderColor, 'focus-within'],
    opacity: [...defaultConfig.variants.opacity, 'disabled'],
    cursor: [...defaultConfig.variants.cursor, 'disabled'],
  },
  plugins: [
    plugin(({ addVariant, e }) => {
      addVariant('hidden', ({ modifySelectors, separator }) => {
        modifySelectors(
          ({ className }) => `.${e(`hidden${separator}${className}`)}[hidden]`
        );
      });
    }),
  ],
};
