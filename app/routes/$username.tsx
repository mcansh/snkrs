import React from 'react';
import { useRouteData } from '@remix-run/react';
import type { Sneaker as SneakerType } from '@prisma/client';

import { Sneaker } from '../components/sneaker';

import FourOhFour from './404';

interface Props {
  user: {
    username: string;
    name: string;
    sneakers: SneakerType[];
  };
}

const meta = ({ data }: { data: Props }) => {
  const usernameEndsWithS = data.user.name.toLowerCase().endsWith('s');

  const usernameWithApostrophe = usernameEndsWithS
    ? `${data.user.name}'`
    : `${data.user.name}'s`;

  return {
    title: `Home | ${usernameWithApostrophe} Sneaker Collection`,
    description: `${usernameWithApostrophe} sneaker collection`,
  };
};

const Index = () => {
  const { user } = useRouteData<Props>();

  if (!user) {
    return <FourOhFour />;
  }

  if (!user.sneakers.length) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        <p>No sneakers</p>
      </div>
    );
  }

  return (
    <main className="container min-h-full p-4 mx-auto">
      <h1 className="pb-2 text-xl sm:text-4xl">
        Sneaker Collection – {user.sneakers.length} and counting
      </h1>

      <ul className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4 sm:grid-cols-2 md:grid-cols-4">
        {user.sneakers.map(sneaker => (
          <Sneaker key={sneaker.id} {...sneaker} />
        ))}
      </ul>
    </main>
  );
};

export default Index;
export { meta };
