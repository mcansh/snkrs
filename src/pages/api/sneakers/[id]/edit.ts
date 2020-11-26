import superjson from 'superjson';

import type { NextApiHandlerSession } from 'src/utils/with-session';
import { withSession } from 'src/utils/with-session';
import { withMethods } from 'src/utils/with-methods';
import { prisma } from 'prisma/db';

const handler: NextApiHandlerSession = async (req, res) => {
  const userId = req.session.get('userId');
  const id = req.query.id as string;

  if (!userId) {
    return res.status(401).json({ error: 'not authenticated' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return res.status(401).json({ error: 'not authenticated' });
  }

  const sneaker = await prisma.sneaker.findUnique({
    where: { id },
  });

  if (!sneaker) {
    return res.status(404).json({ error: 'No sneaker with that id' });
  }

  if (sneaker.userId !== userId) {
    return res.status(401).json({ error: "you don't own that sneaker" });
  }

  const purchaseDate = req.body.purchaseDate
    ? new Date(req.body.purchaseDate)
    : null;

  const soldDate = req.body.soldDate ? new Date(req.body.soldDate) : null;

  const updatedSneaker = await prisma.sneaker.update({
    where: { id },
    data: { ...req.body, soldDate, purchaseDate },
  });

  return res.status(200).json(superjson.stringify(updatedSneaker));
};

export default withSession(withMethods(handler, ['PATCH']));
