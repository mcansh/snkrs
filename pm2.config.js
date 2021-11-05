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
      script: 'remix run',
      ignore_watch: ['.'],
      env: {
        NODE_ENV: 'development',
        ...result,
      },
    },
    {
      name: 'Redis',
      script: './scripts/start-redis.sh',
      ignore_watch: ['.'],
    },
  ],
};
