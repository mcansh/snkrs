const defaultTheme = require('tailwindcss/defaultTheme');
module.exports = {
  purge: ['./**/{pages,components}/**/*.{js,jsx,ts,tsx}'],
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
  variants: {},
  plugins: [require('@tailwindcss/ui')],
};
