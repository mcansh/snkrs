import { OrderByArg } from '@prisma/client';

import { prisma } from 'prisma/db';

async function getYearInSneakers(year: number, order: OrderByArg = 'asc') {
  const rawSneakers = await prisma.sneaker.findMany({
    orderBy: { purchaseDate: order },
    where: {
      purchaseDate: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31),
      },
    },
  });

  const sneakers = rawSneakers.map(sneaker => ({
    ...sneaker,
    purchaseDate: sneaker.purchaseDate?.toISOString() ?? null,
    soldDate: sneaker.soldDate?.toISOString() ?? null,
  }));

  return sneakers;
}

export { getYearInSneakers };
