import React from 'react';
import { Prisma } from '@prisma/client';
import { json, useLoaderData } from 'remix';
import { endOfYear, startOfYear } from 'date-fns';
import type { MetaFunction, LoaderFunction } from 'remix';
import invariant from 'tiny-invariant';

import { SneakerCard } from '~/components/sneaker';
import { prisma } from '~/db.server';
import { getSeoMeta } from '~/seo';

let userWithSneakers = Prisma.validator<Prisma.UserArgs>()({
  select: {
    username: true,
    sneakers: { include: { brand: true } },
    settings: true,
  },
});

type UserWithSneakers = Prisma.UserGetPayload<typeof userWithSneakers>;

interface RouteData {
  user: UserWithSneakers;
  year: number;
}

let loader: LoaderFunction = async ({ params }) => {
  invariant(params.year, 'year is required');
  invariant(params.username, 'username is required');
  let year = parseInt(params.year, 10);

  let date = new Date(year, 0);
  let start = startOfYear(date);
  let end = endOfYear(date);

  if (year > new Date().getFullYear()) {
    throw new Response('Requested year is in the future', { status: 404 });
  }

  let user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      username: true,
      settings: true,
      sneakers: {
        orderBy: { purchaseDate: 'asc' },
        include: { brand: true },
        where: {
          purchaseDate: {
            gte: start,
            lte: end,
          },
        },
      },
    },
  });

  if (!user) {
    throw new Response('', { status: 404 });
  }

  return json<RouteData>({ user, year });
};

let meta: MetaFunction = ({ data }: { data: RouteData | null }) => {
  if (!data?.user) {
    return getSeoMeta({
      title: "Ain't nothing here",
    });
  }

  let sneakers = data.user.sneakers.length === 1 ? 'sneaker' : 'sneakers';
  return getSeoMeta({
    title: `${data.year} • ${data.user.username}`,
    description: `${data.user.username} bought ${data.user.sneakers.length} ${sneakers} in ${data.year}`,
  });
};

let SneakersYearInReview: React.VFC = () => {
  let { user, year } = useLoaderData<RouteData>();

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
          <SneakerCard
            key={sneaker.id}
            {...sneaker}
            showPurchasePrice={user.settings?.showPurchasePrice ?? true}
          />
        ))}
      </ul>
    </main>
  );
};

export default SneakersYearInReview;
export { meta, loader };
