import type { Loader } from '@remix-run/data';
import { json } from '@remix-run/data';

import type { Context } from '../db';
import { NotFoundError } from '../errors';

const loader: Loader = async ({ params, context }) => {
  const { prisma } = context as Context;
  const { username } = params;
  const year = parseInt(params.year, 10);

  try {
    if (year > new Date().getFullYear()) {
      throw new NotFoundError();
    }

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
      throw new NotFoundError();
    }

    return new Response(JSON.stringify({ year, user }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return json({}, { status: 404 });
    }

    return json({}, { status: 500 });
  }
};

export { loader };
