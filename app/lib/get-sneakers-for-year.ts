import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getYearInSneakers(year: number, order: Prisma.SortOrder = 'asc') {
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
