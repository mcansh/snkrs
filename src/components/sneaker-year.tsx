import React from 'react';
import { NextPage } from 'next';
import useSWR from 'swr';
import { NextSeo } from 'next-seo';

import { Sneaker, SneakerISODate } from 'src/components/sneaker';

export interface SneakerYearProps {
  sneakers: SneakerISODate[];
  year: number;
}

const SneakerYear: NextPage<SneakerYearProps> = ({ year, sneakers }) => {
  const { data } = useSWR<SneakerISODate[]>(`/api/sneakers/${year}`, {
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
      <NextSeo
        title={String(year)}
        description={`Logan bought ${data.length} sneakers in ${year}`}
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
