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
      colors: {
        blue: {
          bsod: '#0827F5',
        },
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['disabled'],
      borderColor: ['focus-within'],
      opacity: ['disabled'],
      cursor: ['disabled'],
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/forms'),
    plugin(({ addVariant, e }) => {
      addVariant('hidden', ({ modifySelectors, separator }) => {
        modifySelectors(
          ({ className }) => `.${e(`hidden${separator}${className}`)}[hidden]`
        );
      });
    }),
  ],
};
