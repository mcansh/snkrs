import { NextApiHandler } from 'next';

import { withMethods } from 'src/utils/with-methods';
import { prisma } from 'prisma/db';

const handler: NextApiHandler = async (req, res) => {
  const sneaker = await prisma.sneaker.findOne({
    where: { id: req.query.id as string },
  });

  return res.json(sneaker);
};

export default withMethods(handler, ['GET']);
