import { NextApiHandler } from 'next';
import { PrismaClient } from '@prisma/client';

const handler: NextApiHandler = async (req, res) => {
  const prisma = new PrismaClient({ forceTransactions: true });

  const year = parseInt(req.query.year as string, 10);

  const sneakers = await prisma.sneaker.findMany({
    orderBy: { purchaseDate: 'asc' },
    where: {
      purchaseDate: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31),
      },
    },
  });

  return res.json(sneakers);
};

export default handler;
