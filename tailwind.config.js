const defaultConfig = require('tailwindcss/defaultConfig');
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  future: 'all',
  experimental: 'all',
  purge: {
    content: ['./**/{pages,components}/**/*.{js,jsx,ts,tsx}'],
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
  plugins: [require('@tailwindcss/ui')],
};
