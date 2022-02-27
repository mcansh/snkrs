import { createSessionStorage } from 'remix';
import cuid from 'cuid';
import { addWeeks, differenceInMilliseconds } from 'date-fns';
import type { SessionStorage } from 'remix';

import { redis } from './lib/redis.server';

function createRedisSessionStorage({
  cookie,
}: {
  cookie: Parameters<typeof createSessionStorage>['0']['cookie'];
}) {
  return createSessionStorage({
    cookie,
    async createData(data, expires) {
      // `expires` is a Date after which the data should be considered
      // invalid. You could use it to invalidate the data somehow or
      // automatically purge this record from your database.
      const id = cuid();

      const now = new Date();

      const diff = expires
        ? differenceInMilliseconds(expires, now)
        : addWeeks(now, 2).getTime();

      await redis.set(id, JSON.stringify(data), 'px', diff);

      return id;
    },
    async readData(id) {
      const session = await redis.get(id);
      if (!session) return null;
      try {
        return JSON.parse(session);
      } catch (error: unknown) {
        // invalid session data
        return null;
      }
    },
    async updateData(id, data, expires) {
      const now = new Date();

      const diff = expires
        ? differenceInMilliseconds(expires, now)
        : addWeeks(now, 2).getTime();

      await redis.set(id, JSON.stringify(data), 'px', diff);
    },
    async deleteData(id) {
      await redis.del(id);
    },
  });
}

// eslint-disable-next-line @typescript-eslint/unbound-method
const { getSession, commitSession, destroySession }: SessionStorage =
  createRedisSessionStorage({
    cookie: {
      name: '__session',
      secrets: [process.env.SESSION_PASSWORD],
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 14, // 2 weeks
      httpOnly: true,
      path: '/',
      secure: true,
    },
  });

export { getSession, commitSession, destroySession };
