/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  appDirectory: 'app',
  assetsBuildDirectory: 'public/build',
  publicPath: '/build/',
  devServerBroadcastDelay: 1_000,
  future: {
    unstable_dev: true,
    v2_routeConvention: true,
    unstable_tailwind: true,
  },
};
