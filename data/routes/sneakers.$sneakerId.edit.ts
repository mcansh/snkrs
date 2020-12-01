import type { Loader } from '@remix-run/data';
import { redirect } from '@remix-run/data';

import { redirectKey, sessionKey } from '../constants';
import type { Context } from '../db';

const loader: Loader = async ({ params, session, context }) => {
  const { prisma } = context as Context;
  const sneaker = await prisma.sneaker.findUnique({
    where: { id: params.sneakerId },
    include: { User: { select: { name: true, id: true } } },
  });

  const userId = session.get(sessionKey);

  const userCreatedSneaker = sneaker?.User.id === userId;

  if (!userId || !userCreatedSneaker) {
    session.set(redirectKey, `/sneakers/${params.sneakerId}/edit`);
    return redirect(`/login`);
  }

  const body = JSON.stringify({
    sneaker,
    id: params.sneakerId,
    userCreatedSneaker,
  });

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control':
        'max-age=300, s-maxage=600, stale-while-revalidate=31536000',
    },
  });
};

export { loader };
