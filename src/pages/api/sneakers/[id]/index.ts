import type { NextApiHandler } from 'next';
import superjson from 'superjson';

import { withMethods } from 'src/utils/with-methods';
import { prisma } from 'prisma/db';

const handler: NextApiHandler = async (req, res) => {
  const sneaker = await prisma.sneaker.findUnique({
    where: { id: req.query.id as string },
    include: { User: { select: { name: true } } },
  });

  return res.json(superjson.stringify(sneaker));
};

export default withMethods(handler, ['GET']);
