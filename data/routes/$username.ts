import type { Loader } from '@remix-run/data';
import { json } from '@remix-run/data';

import type { Context } from '../db';
import { NotFoundError } from '../errors';

const loader: Loader = async ({ context, params }) => {
  const { username } = params;
  const { prisma } = context as Context;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        name: true,
        username: true,
        sneakers: { orderBy: { purchaseDate: 'desc' } },
      },
    });

    if (!user) {
      throw new NotFoundError();
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
  } catch (error) {
    if (error instanceof NotFoundError) {
      return new Response(JSON.stringify({}), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return json({}, { status: 500 });
  }
};

export { loader };
