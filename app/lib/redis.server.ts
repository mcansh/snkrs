import Redis from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is not defined');
}

declare global {
  // This prevents us from making multiple connections to redis when the
  // require cache is cleared.
  // eslint-disable-next-line vars-on-top, no-var
  var globalRedisClient: Redis.Redis | undefined;
}

let redis: Redis.Redis;

if (process.env.NODE_ENV === 'production') {
  redis = new Redis(process.env.REDIS_URL);
} else {
  if (!global.globalRedisClient) {
    global.globalRedisClient = new Redis(process.env.REDIS_URL);
  }
  redis = global.globalRedisClient;
}

export { redis };
