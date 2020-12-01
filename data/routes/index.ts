import type { Loader } from '@remix-run/data';
import { redirect } from '@remix-run/data';

import { flashMessageKey, sessionKey } from '../constants';
import type { Context } from '../db';
import { flashMessage } from '../flash-message';

const loader: Loader = async ({ session, context }) => {
  const { prisma } = context as Context;
  const userId = session.get(sessionKey);

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user) {
      return redirect(`/${user.username}`);
    }

    session.flash(flashMessageKey, flashMessage('User not found', 'error'));
    return redirect(`/loganmcansh`);
  }

  return redirect(`/loganmcansh`);
};

export { loader };
