import React from 'react';
import type { Sneaker as SneakerType } from '@prisma/client';
import { useRouteData } from '@remix-run/react';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';

import { Sneaker } from '../components/sneaker';
import { prisma } from '../db';
import { NotFoundError } from '../errors';

import FourOhFour, { meta as fourOhFourMeta } from './404';

interface SneakerYearProps {
  user: {
    sneakers: SneakerType[];
    username: string;
    name: string;
  };
  year: number;
}

const loader: LoaderFunction = async ({ params }) => {
  const { username } = params;
  const year = parseInt(params.year, 10);

  try {
    if (year > new Date().getFullYear()) {
      throw new NotFoundError();
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        name: true,
        username: true,
        sneakers: {
          orderBy: { purchaseDate: 'asc' },
          where: {
            purchaseDate: {
              gte: new Date(year, 0, 1),
              lte: new Date(year, 11, 31),
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError();
    }

    return new Response(JSON.stringify({ year, user }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return json({}, { status: 404 });
    }

    return json({}, { status: 500 });
  }
};

const meta = ({ data }: { data: SneakerYearProps }) => {
  if (!data.user) {
    return fourOhFourMeta();
  }

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
export { meta, loader };
