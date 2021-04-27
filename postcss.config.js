module.exports = {
  plugins: [
    require('autoprefixer'),
    require('tailwindcss'),
    process.env.NODE_ENV === 'production' ? require('cssnano') : false,
  ].filter(Boolean),
};
