import cuid from 'cuid';
import { addWeeks, differenceInMilliseconds } from 'date-fns';
import { createSessionStorage } from 'remix';

import { redis } from './lib/redis.server';

export function createRedisSessionStorage({
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
      let id = cuid();

      let now = new Date();

      let diff = expires
        ? differenceInMilliseconds(expires, now)
        : addWeeks(now, 2).getTime();

      await redis.set(id, JSON.stringify(data), 'px', diff);

      return id;
    },
    async readData(id) {
      let session = await redis.get(id);
      if (!session) return null;
      try {
        return JSON.parse(session);
      } catch (error: unknown) {
        // invalid session data
        return null;
      }
    },
    async updateData(id, data, expires) {
      let now = new Date();

      let diff = expires
        ? differenceInMilliseconds(expires, now)
        : addWeeks(now, 2).getTime();

      await redis.set(id, JSON.stringify(data), 'px', diff);
    },
    async deleteData(id) {
      await redis.del(id);
    },
  });
}
