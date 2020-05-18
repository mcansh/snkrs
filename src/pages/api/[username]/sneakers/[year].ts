import { NextApiHandler } from 'next';

import { prisma } from 'prisma';

const handler: NextApiHandler = async (req, res) => {
  const year = parseInt(req.query.year as string, 10);

  const sneakers = await prisma.sneaker.findMany({
    orderBy: { purchaseDate: 'asc' },
    where: {
      AND: [
        { User: { username: req.query.username as string } },
        {
          purchaseDate: {
            gte: new Date(year, 0, 1),
            lte: new Date(year, 11, 31),
          },
        },
      ],
    },
  });

  return res.json(sneakers);
};

export default handler;
