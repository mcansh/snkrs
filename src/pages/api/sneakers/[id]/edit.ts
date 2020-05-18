import { NextApiHandlerSession, withSession } from 'src/utils/with-session';
import { withMethods } from 'src/utils/with-methods';
import { prisma } from 'prisma';

const handler: NextApiHandlerSession = async (req, res) => {
  const userId = req.session.get('userId');
  const id = req.query.id as string;

  if (!userId) {
    return res.status(401).json({ error: 'not authenticated' });
  }

  const user = await prisma.user.findOne({ where: { id: userId } });

  if (!user) {
    return res.status(401).json({ error: 'not authenticated' });
  }

  const purchaseDate = req.body.purchaseDate
    ? new Date(req.body.purchaseDate)
    : null;

  const sneaker = await prisma.sneaker.update({
    where: { id },
    data: { ...req.body, purchaseDate },
  });

  return res.status(200).json(sneaker);
};

export default withSession(withMethods(handler, ['PATCH']));
