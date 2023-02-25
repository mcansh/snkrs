/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  appDirectory: "app",
  assetsBuildDirectory: "public/build",
  serverBuildPath: "build/index.js",
  publicPath: "/build/",
  future: {
    unstable_cssSideEffectImports: true,
    unstable_dev: true,
    v2_routeConvention: true,
    unstable_tailwind: true,
    unstable_postcss: true,
  },
};
