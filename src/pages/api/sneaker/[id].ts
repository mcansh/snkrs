import { NextApiHandler } from 'next';
import { PrismaClient } from '@prisma/client';

const handler: NextApiHandler = async (req, res) => {
  const prisma = new PrismaClient({ forceTransactions: true });

  const sneaker = await prisma.sneaker.findOne({
    where: { id: req.query.id as string },
  });

  return res.json(sneaker);
};

export default handler;
