import Redis from 'ioredis';

if (!process.env.FLY_REDIS_CACHE_URL) {
  throw new Error('FLY_REDIS_CACHE_URL is not defined');
}

const redis = new Redis(process.env.FLY_REDIS_CACHE_URL);

export { redis };
