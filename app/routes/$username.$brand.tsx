import React from 'react';
import { useRouteData } from '@remix-run/react';
import type { Sneaker as SneakerType } from '@prisma/client';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';

import { Sneaker } from '../components/sneaker';
import { NotFoundError } from '../errors';
import { prisma } from '../db';

import FourOhFour, { meta as fourOhFourMeta } from './404';

interface Props {
  sneakers: SneakerType[];
  brand: string;
  user: {
    username: string;
    name: string;
  };
}

const loader: LoaderFunction = async ({ params }) => {
  const { brand, username } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        name: true,
        username: true,
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundError();
    }

    const sneakers = await prisma.sneaker.findMany({
      where: {
        User: { id: user.id },
        brand: {
          equals: brand,
          mode: 'insensitive',
        },
      },
      orderBy: { purchaseDate: 'desc' },
    });

    return json({ sneakers, user, brand: sneakers[0].brand ?? brand });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return json({}, { status: 404 });
    }
    console.error(error);
    return json({}, { status: 500 });
  }
};

const meta = ({ data }: { data: Props }) => {
  if (!data.user) {
    return fourOhFourMeta();
  }

  const usernameEndsWithS = data.user.name.toLowerCase().endsWith('s');

  const usernameWithApostrophe = usernameEndsWithS
    ? `${data.user.name}'`
    : `${data.user.name}'s`;

  return {
    title: `${data.brand} | ${usernameWithApostrophe} Sneaker Collection`,
    description: `${usernameWithApostrophe} ${data.brand} sneaker collection`,
  };
};

const Index = () => {
  const { user, sneakers, brand } = useRouteData<Props>();

  if (!user) {
    return <FourOhFour />;
  }

  if (!sneakers.length) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        <p>No sneakers</p>
      </div>
    );
  }

  return (
    <main className="container min-h-full p-4 mx-auto">
      <h1 className="pb-2 text-xl sm:text-4xl">
        {brand} Sneaker Collection – {sneakers.length} and counting
      </h1>

      <ul className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4 sm:grid-cols-2 md:grid-cols-4">
        {sneakers.map(sneaker => (
          <Sneaker key={sneaker.id} {...sneaker} />
        ))}
      </ul>
    </main>
  );
};

export default Index;
export { meta, loader };
