import type { LoaderFunction } from '@remix-run/node';
import { route } from 'routes-gen';

import { loader as homeLoader } from './home';

import { getUserId, createUserSession } from '~/session.server';
import { prisma } from '~/db.server';
export { default, meta } from './home';

export const loader: LoaderFunction = async ({ request, ...args }) => {
  let userId = await getUserId(request);
  if (userId) {
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      return createUserSession(
        request,
        user.id,
        route('/:username', { username: user.username })
      );
    }
  }

  return homeLoader({ request, ...args });
};
