const withSourceMaps = require('@zeit/next-source-maps')();
const withOffline = require('next-offline');

const nextConfig = {
  dontAutoRegisterSw: true,
  workboxOpts: {
    swDest: 'static/sw.js',
    runtimeCaching: [
      {
        handler: 'StaleWhileRevalidate',
        urlPattern: /[.](webp|png|jpg|woff|woff2)/,
      },
      {
        handler: 'NetworkFirst',
        urlPattern: /^https?.*/,
      },
    ],
  },
  crossOrigin: 'anonymous',
  experimental: {
    modern: true,
    redirects: () => [{ source: '/shoes/:id', destination: '/sneakers/:id' }],
  },
  env: {
    VERSION: require('./package.json').version,
    QUICKMETRICS_API_KEY: process.env.QUICKMETRICS_API_KEY,
  },
  webpack: config => {
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            svgoConfig: {
              plugins: [
                { removeViewBox: false },
                { removeDimensions: true },
                {
                  prefixIds: {
                    delim: '_',
                    prefixIds: true,
                    prefixClassNames: false,
                  },
                },
              ],
            },
          },
        },
      ],
    });

    return config;
  },
};

module.exports = withSourceMaps(withOffline(nextConfig));
