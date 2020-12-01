import type { Loader } from '@remix-run/data';

import type { Context } from '../db';

const loader: Loader = async ({ context, params }) => {
  const { username } = params;
  const { prisma } = context as Context;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      name: true,
      username: true,
      sneakers: { orderBy: { purchaseDate: 'desc' } },
    },
  });

  if (!user) {
    return new Response(null, {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const body = JSON.stringify({ user });

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
