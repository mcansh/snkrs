const { flatRoutes } = require('remix-flat-routes');

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  appDirectory: 'app',
  assetsBuildDirectory: 'public/build',
  publicPath: '/build/',
  server: './server.ts',
  // ignore all files in routes folder
  ignoredRouteFiles: ['**/*'],
  routes(defineRoutes) {
    return flatRoutes('routes', defineRoutes);
  },
  devServerBroadcastDelay: 1_000,
};
