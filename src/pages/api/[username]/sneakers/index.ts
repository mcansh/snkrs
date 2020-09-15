import { NextApiHandler } from 'next';
import superjson from 'superjson';

import { withMethods } from 'src/utils/with-methods';
import { prisma } from 'prisma/db';

const handler: NextApiHandler = async (req, res) => {
  const sneakers = await prisma.sneaker.findMany({
    orderBy: { purchaseDate: 'desc' },
    where: { User: { username: req.query.username as string } },
  });

  return res.json(superjson.stringify(sneakers));
};

export default withMethods(handler, ['GET']);
