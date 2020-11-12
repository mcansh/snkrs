import type { User } from '@prisma/client';

import { withMethods } from 'src/utils/with-methods';
import type { NextApiHandlerSession } from 'src/utils/with-session';
import { withSession } from 'src/utils/with-session';
import { prisma } from 'prisma/db';

type Base = { isLoggedIn: boolean };

export type UserResponse =
  | ({ user?: never } & Base)
  | (Omit<User, 'password' | 'sneakers'> & Base);

const handler: NextApiHandlerSession<UserResponse> = async (req, res) => {
  const userId = req.session.get('userId');

  if (!userId) {
    return res.status(200).json({ isLoggedIn: false });
  }

  const user = await prisma.user.findOne({
    where: { id: userId },
    select: {
      email: true,
      id: true,
      name: true,
      password: false,
      sneakers: false,
      username: true,
    },
  });

  if (!user) {
    return res.status(200).json({ isLoggedIn: false });
  }

  return res.status(200).json({ ...user, isLoggedIn: true });
};

export default withSession(withMethods(handler, ['GET']));
