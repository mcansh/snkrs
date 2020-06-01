import argon2 from 'argon2';

import { withMethods } from 'src/utils/with-methods';
import { withSession, NextApiHandlerSession } from 'src/utils/with-session';
import { prisma } from 'prisma/db';
import { loginSchema } from 'src/lib/schemas/login';

const handler: NextApiHandlerSession = async (req, res) => {
  const [user] = await prisma.user.findMany({
    where: { email: req.body.email },
  });

  if (!user) {
    return res.status(404).json({ error: 'No user found' });
  }

  const validPassword = await argon2.verify(user.password, req.body.password);

  if (!validPassword) {
    return res.status(422).json({ error: 'Invalid auth' });
  }

  try {
    await loginSchema.validate(req.body);
  } catch (error) {
    return res.status(422).json({ error });
  }

  req.session.set('userId', user.id);
  await req.session.save();
  delete user.password;
  return res.json({ ...user, isLoggedIn: true });
};

export default withSession(withMethods(handler, ['POST']));
