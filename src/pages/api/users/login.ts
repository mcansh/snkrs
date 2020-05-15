import argon2 from 'argon2';

import { withMethods } from 'src/utils/with-methods';
import { withSession, NextApiHandlerSession } from 'src/utils/with-session';
import { prisma } from 'prisma';

const handler: NextApiHandlerSession = async (req, res) => {
  const [user] = await prisma.user.findMany({
    where: {
      OR: [{ email: req.body.email }, { username: req.body.username }],
    },
  });

  if (!user) {
    return res.status(400).json({ error: 'No user found' });
  }

  const validPassword = await argon2.verify(user.password, req.body.password);

  if (!validPassword) {
    return res.status(400).json({ error: 'Invalid auth' });
  }

  req.session.set('userId', user.id);
  await req.session.save();
  delete user.password;
  return res.json(user);
};

export default withSession(withMethods(handler, ['POST']));
