import Redis from 'ioredis';

const redis = new Redis(process.env.FLY_REDIS_CACHE_URL);

const isDev = process.env.NODE_ENV === 'development';
async function saveByPage<T>(page: string, data: T, msTTL: number) {
  try {
    return await redis.set(
      page,
      JSON.stringify(data),
      'px',
      isDev ? 10_000 : msTTL
    );
  } catch (error: unknown) {
    console.error('Failed to save in redis', error);
    return null;
  }
}

export { saveByPage, redis };
