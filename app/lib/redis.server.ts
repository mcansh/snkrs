import Redis from 'ioredis';

const redis = new Redis(process.env.FLY_REDIS_CACHE_URL);

async function saveByPage<T>(page: string, data: T, msTTL: number) {
  try {
    return await redis.set(page, JSON.stringify(data), 'px', msTTL);
  } catch (error: unknown) {
    console.error('Failed to save in redis', error);
    return null;
  }
}

export { saveByPage, redis };
