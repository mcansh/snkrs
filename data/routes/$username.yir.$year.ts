import type { Loader } from '@remix-run/data';

import type { Context } from '../db';

const loader: Loader = async ({ params, context }) => {
  const { prisma } = context as Context;
  const { username } = params;
  const year = parseInt(params.year, 10);

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      name: true,
      username: true,
      sneakers: {
        orderBy: { purchaseDate: 'asc' },
        where: {
          purchaseDate: {
            gte: new Date(year, 0, 1),
            lte: new Date(year, 11, 31),
          },
        },
      },
    },
  });

  if (!user) {
    return new Response(null, {
      status: 404,
    });
  }

  return new Response(JSON.stringify({ year, user }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
    },
  });
};

export { loader };
