import { NextApiHandler } from 'next';

import { prisma } from 'prisma/db';

const handler: NextApiHandler = async (_req, res) => {
  const sneakers = await prisma.sneaker.findMany({
    orderBy: { purchaseDate: 'desc' },
  });

  return res.json(sneakers);
};

export default handler;
