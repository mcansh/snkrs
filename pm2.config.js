const dotenv = require('dotenv');

const result = dotenv.config();

if (result.error) {
  throw result.error;
}

module.exports = {
  apps: [
    {
      name: 'CSS',
      script: 'postcss styles --base styles --dir app/styles -w',
      ignore_watch: ['.'],
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'Remix',
      script: 'remix watch',
      ignore_watch: ['.'],
    },
    {
      name: 'Fastify',
      script: 'node ./build/index.js',
      env: {
        NODE_ENV: 'development',
        ...result,
      },
    },
  ],
};
