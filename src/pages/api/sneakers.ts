import { NextApiHandler } from 'next';
import { PrismaClient } from '@prisma/client';

const handler: NextApiHandler = async (_req, res) => {
  const prisma = new PrismaClient({ forceTransactions: true });

  const sneakers = await prisma.sneaker.findMany({
    orderBy: { purchaseDate: 'desc' },
  });

  return res.json(sneakers);
};

export default handler;
