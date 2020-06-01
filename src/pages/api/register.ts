import argon2 from 'argon2';

import { withMethods } from 'src/utils/with-methods';
import { withSession, NextApiHandlerSession } from 'src/utils/with-session';
import { prisma } from 'prisma/db';
import { registerSchema } from 'src/lib/schemas/register';

const handler: NextApiHandlerSession = async (req, res) => {
  const existingUserEmail = await prisma.user.findOne({
    where: { email: req.body.email },
  });

  if (existingUserEmail) {
    return res.status(422).json({
      error: `User with email ${req.body.email} already exists`,
    });
  }

  const existingUserUsername = await prisma.user.findOne({
    where: { username: req.body.username },
  });

  if (existingUserUsername) {
    return res.status(422).json({
      error: `User with username ${req.body.username} already exists`,
    });
  }

  try {
    await registerSchema.validate(req.body);
  } catch (error) {
    return res.status(422).json({ error });
  }

  const hashedPassword = await argon2.hash(req.body.password);

  const user = await prisma.user.create({
    data: {
      email: req.body.email,
      name: req.body.name,
      password: hashedPassword,
      username: req.body.username,
    },
    select: {
      password: false,
      email: true,
      id: true,
      name: true,
      username: true,
      sneakers: false,
    },
  });

  req.session.set('userId', user.id);
  await req.session.save();
  return res.status(201).json({ ...user, isLoggedIn: true });
};

export default withSession(withMethods(handler, ['POST']));
