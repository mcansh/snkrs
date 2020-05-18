import { NextApiHandler } from 'next';

import { withMethods } from 'src/utils/with-methods';
import { prisma } from 'prisma';

const handler: NextApiHandler = async (req, res) => {
  const sneakers = await prisma.sneaker.findMany({
    orderBy: { purchaseDate: 'desc' },
    where: { User: { username: req.query.username as string } },
  });

  return res.json(sneakers);
};

export default withMethods(handler, ['GET']);
