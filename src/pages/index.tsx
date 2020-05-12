import React from 'react';
import { GetStaticProps, NextPage } from 'next';
import Link from 'next/link';
import { PrismaClient, Sneaker } from '@prisma/client';

import { getCloudinaryURL } from 'src/utils/cloudinary';
import { formatMoney } from 'src/utils/format-money';
import { formatDate } from 'src/utils/format-date';

interface SneakerISODate extends Omit<Sneaker, 'purchaseDate' | 'soldDate'> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  purchaseDate: string | null;
  // eslint-disable-next-line @typescript-eslint/ban-types
  soldDate: string | null;
}

interface Props {
  data: {
    getSneakers: SneakerISODate[];
  };
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const prisma = new PrismaClient({ forceTransactions: true });
  const sneakers = await prisma.sneaker.findMany({
    orderBy: { purchaseDate: 'desc' },
  });

  const sneakersWithISODates = sneakers.map(sneaker => ({
    ...sneaker,
    purchaseDate: sneaker.purchaseDate?.toISOString() ?? null,
    soldDate: sneaker.soldDate?.toISOString() ?? null,
  }));

  return {
    // because this data is slightly more dynamic, update it every hour
    unstable_revalidate: 60 * 60,
    props: { data: { getSneakers: sneakersWithISODates } },
  };
};

const Index: NextPage<Props> = ({ data }) => (
  <main className="p-4">
    <h1 className="text-4xl">Sneaker Collection</h1>

    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
      {data.getSneakers.map(sneaker => (
        <li
          key={sneaker.id}
          className="overflow-hidden transition-shadow duration-200 ease-linear bg-white rounded-lg shadow-md hover:shadow-lg"
        >
          <Link href="/sneakers/[id]" as={`/sneakers/${sneaker.id}`}>
            <a className="flex flex-col block h-full ">
              <div className="relative flex items-center justify-center">
                <img
                  loading="lazy"
                  src={getCloudinaryURL(sneaker.imagePublicId, 'f_auto')}
                  alt={`${sneaker.model} by ${sneaker.brand} in the ${sneaker.colorway} colorway`}
                  className="object-contain w-full h-64"
                />
                {sneaker.sold && (
                  <div className="absolute w-full p-1 text-xl font-bold text-center text-white transform -translate-x-1/2 -translate-y-1/2 bg-red-400 bg-opacity-75 top-1/2 left-1/2">
                    Sold!
                  </div>
                )}
              </div>
              <div className="px-4 py-2">
                <h2 className="text-xl truncate">
                  {sneaker.brand} {sneaker.model}
                </h2>
                <p className="text-lg truncate">{sneaker.colorway}</p>
                {sneaker.price && <p>{formatMoney(sneaker.price)}</p>}
                {sneaker.purchaseDate && (
                  <p>Purchased {formatDate(sneaker.purchaseDate)}</p>
                )}
              </div>
            </a>
          </Link>
        </li>
      ))}
    </ul>
  </main>
);

export default Index;
