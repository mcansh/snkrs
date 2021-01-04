import type { Loader } from '@remix-run/data';
import { json } from '@remix-run/data';

import type { Context } from '../db';
import { NotFoundError } from '../errors';

const loader: Loader = async ({ context, params }) => {
  const { prisma } = context as Context;
  const { brand, username } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        name: true,
        username: true,
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundError();
    }

    const sneakers = await prisma.sneaker.findMany({
      where: {
        User: { id: user.id },
        brand: {
          equals: brand,
          mode: 'insensitive',
        },
      },
      orderBy: { purchaseDate: 'desc' },
    });

    const body = JSON.stringify({
      sneakers,
      user,
      brand: sneakers[0].brand ?? brand,
    });

    return new Response(body, {
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
