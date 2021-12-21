import React from 'react';
import { Prisma } from '@prisma/client';
import { json, useLoaderData } from 'remix';
import { endOfYear, startOfYear } from 'date-fns';
import type { MetaFunction, LoaderFunction } from 'remix';

import { SneakerCard } from '../components/sneaker';
import { prisma } from '../db.server';
import { getSeoMeta } from '../seo';

const userWithSneakers = Prisma.validator<Prisma.UserArgs>()({
  select: { username: true, sneakers: { include: { brand: true } } },
});

type UserWithSneakers = Prisma.UserGetPayload<typeof userWithSneakers>;

interface RouteData {
  user: UserWithSneakers;
  year: number;
}

const loader: LoaderFunction = async ({ params }) => {
  const { username } = params;
  const year = parseInt(params.year!, 10);

  const now = new Date();
  const date = new Date(year, now.getMonth(), now.getDate());

  if (year > now.getFullYear()) {
    throw new Response('', { status: 404 });
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
    throw new Response('', { status: 404 });
  }

  const data: RouteData = { year, user };

  return json(data);
};

const meta: MetaFunction = ({ data }: { data: RouteData | null }) => {
  if (!data?.user) {
    return getSeoMeta({
      title: "Ain't nothing here",
    });
  }

  const sneakers = data.user.sneakers.length === 1 ? 'sneaker' : 'sneakers';
  return getSeoMeta({
    title: `${data.year} • ${data.user.username}`,
    description: `${data.user.username} bought ${data.user.sneakers.length} ${sneakers} in ${data.year}`,
  });
};

const SneakersYearInReview: React.VFC = () => {
  const { user, year } = useLoaderData<RouteData>();

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

      <ul className="grid grid-cols-2 gap-2 sm:gap-x-6 gap-y-8 lg:grid-cols-4 xl:gap-x-8">
        {user.sneakers.map(sneaker => (
          <SneakerCard key={sneaker.id} {...sneaker} />
        ))}
      </ul>
    </main>
  );
};

export default SneakersYearInReview;
export { meta, loader };
