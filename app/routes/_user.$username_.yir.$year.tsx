import React from 'react';
import { Prisma } from '@prisma/client';
import type { LoaderArgs, LoaderFunction, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { endOfYear, startOfYear } from 'date-fns';
import invariant from 'tiny-invariant';

import { SneakerCard } from '~/components/sneaker';
import { prisma } from '~/db.server';
import { getSeoMeta } from '~/seo';

export let loader = async ({ params }: LoaderArgs) => {
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

  return json({ user, year });
};

export let meta: MetaFunction<typeof loader> = ({ data }) => {
  let sneakers = data.user.sneakers.length === 1 ? 'sneaker' : 'sneakers';
  return getSeoMeta({
    title: `${data.year} • ${data.user.username}`,
    description: `${data.user.username} bought ${data.user.sneakers.length} ${sneakers} in ${data.year}`,
  });
};

export default function SneakersYearInReview() {
  let { user, year } = useLoaderData<typeof loader>();

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
    <div className="mt-6 lg:mt-0 lg:col-span-2 xl:col-span-3">
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
        {user.sneakers.map(sneaker => (
          <SneakerCard key={sneaker.id} {...sneaker} />
        ))}
      </ul>
    </div>
  );
}
