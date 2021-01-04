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
      },
    });

    if (!user) {
      throw new NotFoundError();
    }

    const sneakers = await prisma.sneaker.findMany({
      where: { User: { username } },
      orderBy: { purchaseDate: 'desc' },
    });

    const filteredSneakers = sneakers.filter(
      sneaker => sneaker.brand.toLowerCase() === brand.toLowerCase()
    );

    const body = JSON.stringify({
      sneakers: filteredSneakers,
      user,
      brand: filteredSneakers[0].brand ?? brand,
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
