import type { SortOrder } from '@prisma/client';

import { prisma } from 'prisma/db';

function getYearInSneakers(year: number, order: SortOrder = 'asc') {
  return prisma.sneaker.findMany({
    orderBy: { purchaseDate: order },
    include: { User: { select: { name: true } } },
    where: {
      purchaseDate: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31),
      },
    },
  });
}

export { getYearInSneakers };
