import { NextApiHandler } from 'next';
import superjson from 'superjson';

import { prisma } from 'prisma/db';

const handler: NextApiHandler = async (req, res) => {
  const year = parseInt(req.query.year as string, 10);

  const sneakers = await prisma.sneaker.findMany({
    orderBy: { purchaseDate: 'asc' },
    include: { User: { select: { name: true } } },
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

  return res.json(superjson.stringify(sneakers));
};

export default handler;
