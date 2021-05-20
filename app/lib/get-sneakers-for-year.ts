import { prisma } from '../db';

import type { Prisma } from '@prisma/client';

function getYearInSneakers(year: number, order: Prisma.SortOrder = 'asc') {
  return prisma.sneaker.findMany({
    orderBy: { purchaseDate: order },
    include: { user: { select: { givenName: true, familyName: true } } },
    where: {
      purchaseDate: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31),
      },
    },
  });
}

export { getYearInSneakers };
