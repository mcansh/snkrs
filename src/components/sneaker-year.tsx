import React from 'react';
import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import type { Sneaker as SneakerType } from '@prisma/client';

import { Sneaker } from 'src/components/sneaker';
import { useSneakerYear } from 'src/hooks/use-sneakers';

export interface SneakerYearProps {
  sneakers: (SneakerType & {
    User: {
      name: string;
    };
  })[];
  year: number;
}

const SneakerYear: NextPage<SneakerYearProps> = ({ year, sneakers }) => {
  const { data } = useSneakerYear(year, sneakers);

  if (!data || !data.length) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        <p>No sneakers</p>
      </div>
    );
  }

  return (
    <main className="container min-h-full p-4 mx-auto">
      <NextSeo
        title={String(year)}
        description={`${data[0].User.name} bought ${data.length} sneakers in ${year}`}
        openGraph={{
          title: `${year} | Sneaker Collection`,
        }}
      />
      <h1 className="text-xl sm:text-4xl">
        Sneakers bought in {year} – {data.length}
        {new Date().getFullYear() === year && ` and counting`}
      </h1>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
        {data.map(sneaker => (
          <Sneaker key={sneaker.id} {...sneaker} />
        ))}
      </ul>
    </main>
  );
};

export { SneakerYear };
