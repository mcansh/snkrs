import type { Prisma } from '@prisma/client';

import { prisma } from '../db';

function getYearInSneakers(year: number, order: Prisma.SortOrder = 'asc') {
  return prisma.sneaker.findMany({
    orderBy: { purchaseDate: order },
    include: { User: { select: { givenName: true, familyName: true } } },
    where: {
      purchaseDate: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31),
      },
    },
  });
}

export { getYearInSneakers };
