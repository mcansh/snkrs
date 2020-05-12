import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient({ forceTransactions: true });

export interface Context {
  req: NextApiRequest;
  res: NextApiResponse;
  db: PrismaClient;
}

const context = (ctx: { req: NextApiRequest; res: NextApiResponse }) => ({
  req: ctx.req,
  res: ctx.res,
  db: prisma,
});

export { context };
