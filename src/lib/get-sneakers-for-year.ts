import { PrismaClient, OrderByArg } from '@prisma/client';

async function getYearInSneakers(year: number, order: OrderByArg = 'asc') {
  const prisma = new PrismaClient({ forceTransactions: true });

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
