import { PrismaClient } from '@prisma/client';

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

export { prisma };
