import React from 'react';
import { Sneaker as SneakerType } from '@prisma/client';
import { GetStaticProps, NextPage } from 'next';

import { Sneaker } from 'src/components/sneaker';
import { prisma } from 'prisma/db';
import { useUserSneakers } from 'src/hooks/use-sneakers';

interface Props {
  sneakers: SneakerType[];
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const sneakers = await prisma.sneaker.findMany({
    orderBy: { purchaseDate: 'desc' },
    where: { User: { username: 'loganmcansh' } },
  });

  return {
    // because this data is slightly more dynamic, update it every hour
    revalidate: 60 * 60,
    props: { sneakers },
  };
};

const Index: NextPage<Props> = ({ sneakers }) => {
  const { data } = useUserSneakers('loganmcansh', sneakers);

  if (!sneakers?.length || !data?.length) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        <p>No sneakers</p>
      </div>
    );
  }

  return (
    <main className="container min-h-full p-4 mx-auto">
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
