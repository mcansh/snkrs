import React from 'react';
import { GetStaticProps, NextPage } from 'next';
import useSWR from 'swr';

import { Sneaker, SneakerISODate } from 'src/components/sneaker';
import { prisma } from 'prisma/db';

interface Props {
  sneakers: SneakerISODate[];
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const rawSneakers = await prisma.sneaker.findMany({
    orderBy: { purchaseDate: 'desc' },
  });

  const sneakers = rawSneakers.map(sneaker => ({
    ...sneaker,
    purchaseDate: sneaker.purchaseDate?.toISOString() ?? null,
    soldDate: sneaker.soldDate?.toISOString() ?? null,
  }));

  return {
    // because this data is slightly more dynamic, update it every hour
    revalidate: 60 * 60,
    props: { sneakers },
  };
};

const Index: NextPage<Props> = ({ sneakers }) => {
  const { data } = useSWR<SneakerISODate[]>('/api/loganmcansh/sneakers', {
    initialData: sneakers,
  });

  if (!sneakers?.length || !data?.length) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        <p>No sneakers</p>
      </div>
    );
  }

  return (
    <main className="container h-full p-4 mx-auto">
      <h1 className="text-xl sm:text-4xl">
        Sneaker Collection – {data.length} and counting
      </h1>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {data.map(sneaker => (
          <Sneaker key={sneaker.id} {...sneaker} />
        ))}
      </ul>
    </main>
  );
};

export default Index;
