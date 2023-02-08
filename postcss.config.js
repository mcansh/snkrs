/* eslint global-require: "off" */

module.exports = {
  plugins: [
    require("autoprefixer"),
    require("tailwindcss"),
    require("postcss-100vh-fix"),
    process.env.NODE_ENV === "production" ? require("cssnano") : false,
  ].filter(Boolean),
};
