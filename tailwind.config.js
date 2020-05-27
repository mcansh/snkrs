module.exports = {
  purge: ['./**/{pages,components}/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      inset: {
        '1/2': '50%',
      },
    },
  },
  variants: {},
  plugins: [require('@tailwindcss/ui')],
};
