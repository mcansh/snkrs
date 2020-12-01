import React from 'react';
import type { Sneaker as SneakerType } from '@prisma/client';
import { useRouteData } from '@remix-run/react';

import { Sneaker } from '../components/sneaker';

import FourOhFour from './404';

interface SneakerYearProps {
  user: {
    sneakers: SneakerType[];
    username: string;
    name: string;
  };
  year: number;
}

const meta = ({ data }: { data: SneakerYearProps }) => {
  const sneakers = data.user.sneakers.length === 1 ? 'sneaker' : 'sneakers';
  return {
    title: data.year,
    description: `${data.user.username} bought ${data.user.sneakers.length} ${sneakers} in ${data.year}`,
  };
};

const SneakersYearInReview: React.VFC = () => {
  const { user, year } = useRouteData<SneakerYearProps>();

  if (!user || year > new Date().getFullYear()) {
    return <FourOhFour />;
  }

  if (!user.sneakers.length) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        <p>
          {user.username} didn&apos;t buy any sneakers in {year}
        </p>
      </div>
    );
  }

  return (
    <main className="container min-h-full p-4 mx-auto">
      <h1 className="pb-2 text-xl sm:text-4xl">
        Sneakers bought in {year} – {user.sneakers.length}
        {new Date().getFullYear() === year && ` and counting`}
      </h1>

      <ul className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4 sm:grid-cols-2 md:grid-cols-4">
        {user.sneakers.map(sneaker => (
          <Sneaker key={sneaker.id} {...sneaker} />
        ))}
      </ul>
    </main>
  );
};

export default SneakersYearInReview;
export { meta };
