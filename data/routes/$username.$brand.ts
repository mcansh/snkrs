import type { Loader } from '@remix-run/data';

import type { Context } from '../db';

const loader: Loader = async ({ context, params }) => {
  const { prisma } = context as Context;
  const { brand, username } = params;

  const userPromise = prisma.user.findUnique({
    where: { username },
    select: {
      name: true,
      username: true,
    },
  });

  const sneakersPromise = prisma.sneaker.findMany({
    where: { User: { username } },
    orderBy: { purchaseDate: 'desc' },
  });

  const [sneakers, user] = await Promise.all([sneakersPromise, userPromise]);

  const filteredSneakers = sneakers.filter(
    sneaker => sneaker.brand.toLowerCase() === brand.toLowerCase()
  );

  const body = JSON.stringify({ sneakers: filteredSneakers, user, brand });

  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'application/json',
    },
  });
};

export { loader };
