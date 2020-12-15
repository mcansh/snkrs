const isDev =
  process.env.NODE_ENV === 'development' ||
  !['production', 'preview'].includes(process.env.VERCEL_ENV);

module.exports = {
  appDirectory: isDev ? './app' : './app-build',
  browserBuildDirectory: './public/build',
  dataDirectory: './data-build',
  devServerPort: 8002,
  publicPath: '/build/',
  serverBuildDirectory: './build',
};
