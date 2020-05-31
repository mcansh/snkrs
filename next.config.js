const withOffline = require('next-offline');

const isProd = process.env.NODE_ENV === 'production';

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
    productionBrowserSourceMaps: true,
    redirects: () => [
      {
        source: '/shoes',
        destination: '/',
        permanent: isProd,
      },
      {
        source: '/shoes/:id',
        destination: '/sneakers/:id',
        permanent: isProd,
      },
      {
        source: '/sneakers/2015',
        destination: '/sneakers/yir/2015',
        permanent: isProd,
      },
      {
        source: '/sneakers/2016',
        destination: '/sneakers/yir/2016',
        permanent: isProd,
      },
      {
        source: '/sneakers/2017',
        destination: '/sneakers/yir/2017',
        permanent: isProd,
      },
      {
        source: '/sneakers/2018',
        destination: '/sneakers/yir/2018',
        permanent: isProd,
      },
      {
        source: '/sneakers/2019',
        destination: '/sneakers/yir/2019',
        permanent: isProd,
      },
      {
        source: '/sneakers/2020',
        destination: '/sneakers/yir/2020',
        permanent: isProd,
      },
    ],
    rewrites: () => [
      {
        source: '/sw.js',
        destination: '/_next/static/sw.js',
      },
    ],
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

module.exports = withOffline(nextConfig);
