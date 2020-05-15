import { NextApiHandlerSession, withSession } from 'src/utils/with-session';
import { withMethods } from 'src/utils/with-methods';
import { prisma } from 'prisma';

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
      User: {
        connect: { id: userId },
      },
    },
  });

  return res.status(201).json(sneaker);
};

export default withSession(withMethods(handler, ['POST']));
