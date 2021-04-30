import React from 'react';
import { Prisma } from '@prisma/client';
import { useRouteData, json } from 'remix';
import type { LoaderFunction } from 'remix';
import { endOfYear, startOfYear } from 'date-fns';

import { SneakerCard } from '../components/sneaker';
import { prisma } from '../db';
import { NotFoundError } from '../errors';

import FourOhFour, { meta as fourOhFourMeta } from './404';

const userWithSneakers = Prisma.validator<Prisma.UserArgs>()({
  select: { username: true },
  include: { sneakers: { include: { brand: true } } },
});

type UserWithSneakers = Prisma.UserGetPayload<typeof userWithSneakers>;

interface SneakerYearProps {
  user: UserWithSneakers;
  year: number;
}

const loader: LoaderFunction = async ({ params }) => {
  const { username } = params;
  const year = parseInt(params.year, 10);

  const now = new Date();
  const date = new Date(year, now.getMonth(), now.getDate());

  try {
    if (year > now.getFullYear()) {
      throw new NotFoundError();
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        sneakers: {
          orderBy: { purchaseDate: 'asc' },
          include: { brand: true },
          where: {
            purchaseDate: {
              gte: startOfYear(date),
              lte: endOfYear(date),
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError();
    }

    return json({ year, user }, {});
  } catch (error) {
    if (error instanceof NotFoundError) {
      return json({ notFound: true }, { status: 404 });
    }
    console.error(error);
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
    <main className="container h-full p-4 pb-6 mx-auto">
      <h1 className="pb-2 text-xl xs:text-2xl sm:text-4xl">
        Sneakers bought in {year} – {user.sneakers.length}
        {new Date().getFullYear() === year && ` and counting`}
      </h1>

      <ul className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4 sm:grid-cols-2 md:grid-cols-4">
        {user.sneakers.map(sneaker => (
          <SneakerCard key={sneaker.id} {...sneaker} />
        ))}
      </ul>
    </main>
  );
};

export default SneakersYearInReview;
export { meta, loader };
