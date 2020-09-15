import { parseISO } from 'date-fns';
import superjson from 'superjson';

import { NextApiHandlerSession, withSession } from 'src/utils/with-session';
import { withMethods } from 'src/utils/with-methods';
import { prisma } from 'prisma/db';

const handler: NextApiHandlerSession = async (req, res) => {
  const userId = req.session.get('userId');

  if (!userId) {
    return res.status(401).json({ error: 'not authenticated' });
  }

  const user = await prisma.user.findOne({ where: { id: userId } });

  if (!user) {
    return res.status(401).json({ error: 'not authenticated' });
  }

  const sneaker = await prisma.sneaker.create({
    data: {
      ...req.body,
      purchaseDate: parseISO(req.body.purchaseDate),
      size: parseInt(req.body.size, 10),
      User: {
        connect: { id: userId },
      },
    },
  });

  return res.status(201).json(superjson.stringify(sneaker));
};

export default withSession(withMethods(handler, ['POST']));
