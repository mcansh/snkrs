/* eslint no-console: ["error", { allow: ["warn", "error", "info"] }] */
import crypto from 'crypto';

import { PrismaClient } from '@prisma/client';

import { redis } from './lib/redis.server';

declare global {
  // This prevents us from making multiple connections to the db when the
  // require cache is cleared.
  // eslint-disable-next-line vars-on-top, no-var
  var globalPrismaClient: PrismaClient | undefined;
}

// eslint-disable-next-line import/no-mutable-exports
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.globalPrismaClient) {
    global.globalPrismaClient = new PrismaClient();
  }
  prisma = global.globalPrismaClient;
}

function createHash(input: string) {
  const sha1 = crypto.createHash('sha1');
  const data = sha1.update(input, 'utf-8');
  return data.digest('hex');
}

prisma.$use(async (params, next) => {
  const queryTypes = [
    'findUnique',
    'findMany',
    'findFirst',
    'queryRaw',
    'aggregate',
  ];

  if (!queryTypes.includes(params.action)) {
    console.info(`Cache bypassed due to ${params.action} not being a query`);
    return next(params);
  }

  const args = JSON.stringify(params.args);

  const queryHash = createHash(`${params.model}_${params.action}_${args}`);
  const cacheKey = `prisma:${queryHash}`;

  const result = await redis.get(cacheKey);

  if (result) {
    console.info(`Cache hit for ${cacheKey}`);
    return JSON.parse(result);
  }

  console.info(`Cache miss for ${cacheKey}`);
  const newResult = await next(params);
  await redis.set(cacheKey, JSON.stringify(newResult));
  return newResult;
});

export { prisma };
