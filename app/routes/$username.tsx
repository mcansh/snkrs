import * as React from 'react';
import { Link, useRouteData } from 'remix';
import { Prisma } from '@prisma/client';
import uniqBy from 'lodash.uniqby';
import { Disclosure } from '@headlessui/react';
import { json } from 'remix-utils';

import { prisma } from '../db';
import { NotFoundError } from '../errors';
import x from '../icons/outline/x.svg';
import menu from '../icons/outline/menu.svg';
import { sessionKey } from '../constants';
import { time } from '../lib/time';
import { SneakerCard } from '../components/sneaker';
import { commitSession, getSession } from '../session';

import FourOhFour, { meta as fourOhFourMeta } from './404';

import type { Maybe } from '../@types/maybe';
import type { Brand, User } from '@prisma/client';
import type { RouteComponent, LoaderFunction, MetaFunction } from 'remix';

const userWithSneakers = Prisma.validator<Prisma.UserArgs>()({
  select: {
    username: true,
    id: true,
    fullName: true,
    sneakers: {
      include: { brand: true },
    },
  },
});

type UserWithSneakers = Prisma.UserGetPayload<typeof userWithSneakers>;

export interface RouteData {
  brands: Array<Brand>;
  user?: UserWithSneakers;
  selectedBrands: Array<string>;
  sort?: 'asc' | 'desc';
  sessionUser?: Maybe<Pick<User, 'givenName' | 'id'>>;
}

const loader: LoaderFunction = async ({ params, request }) => {
  const session = await getSession(request.headers.get('Cookie'));

  const { searchParams } = new URL(request.url);
  const userId = session.get(sessionKey);

  const selectedBrands = searchParams.getAll('brand');
  const sortQuery = searchParams.get('sort');

  const [userTime, user] = await time(() =>
    prisma.user.findUnique({
      where: {
        username: params.username,
      },
      select: {
        username: true,
        id: true,
        fullName: true,
        sneakers: {
          include: { brand: true },
          orderBy: {
            purchaseDate: sortQuery === 'asc' ? 'asc' : 'desc',
          },
        },
      },
    })
  );

  const [sessionUserTime, sessionUser] = userId
    ? await time(() =>
        prisma.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            givenName: true,
            id: true,
          },
        })
      )
    : [0, undefined];

  if (!user) {
    throw new NotFoundError();
  }

  const sneakers = selectedBrands.length
    ? user.sneakers.filter(sneaker =>
        selectedBrands.includes(sneaker.brand.slug)
      )
    : user.sneakers;

  const uniqueBrands = uniqBy(
    user.sneakers.map(sneaker => sneaker.brand),
    'name'
  ).sort((a, b) => a.name.localeCompare(b.name));

  const headers = new Headers({
    'Server-Timing': `user;dur=${userTime}, sessionUser;dur=${sessionUserTime}`,
  });

  if (sessionUser) {
    headers.append('Set-Cookie', await commitSession(session));
  }

  return json<RouteData>(
    {
      user: { ...user, sneakers },
      brands: uniqueBrands,
      selectedBrands,
      sort: sortQuery === 'asc' ? 'asc' : 'desc',
      sessionUser,
    },
    {
      headers: Object.fromEntries(headers),
    }
  );
};

const meta: MetaFunction = args => {
  const data = args.data as RouteData;

  if (!data.user) {
    return fourOhFourMeta(args);
  }

  const name = `${data.user.fullName}${
    data.user.fullName.endsWith('s') ? "'" : "'s"
  }`;

  return {
    title: `${name} Sneaker Collection`,
    description: `${name} sneaker collection`,
    'twitter:card': 'summary_large_image',
    'twitter:site': '@loganmcansh',
    // TODO: add support for linking your twitter account
    'twitter:creator': '@loganmcansh',
    'twitter:description': `${name} sneaker collection`,
    // TODO: add support for user avatar
  };
};

const sortOptions = [
  { value: 'desc', display: 'Recent first' },
  { value: 'asc', display: 'Oldest first' },
];

const UserSneakersPage: RouteComponent = () => {
  const data = useRouteData<RouteData>();

  if (data.user == null) {
    return <FourOhFour />;
  }

  if (
    data.sessionUser &&
    data.user.sneakers.length === 0 &&
    data.user.id === data.sessionUser.id
  ) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="mb-2 text-lg">
          {data.sessionUser.givenName}, welcome to SNKRS
        </h1>
        <h2 className="mb-2 text-2xl font-bold">Let&apos;s Get Started</h2>
        <Link
          className="text-purple-600 transition-colors duration-150 ease-in-out hover:text-purple-300"
          to="/sneakers/add"
        >
          Add a sneaker to your collection
        </Link>
      </div>
    );
  }

  return (
    <div className="md:flex">
      <Disclosure as="nav" className="bg-white shadow md:hidden">
        {({ open }) => (
          <>
            <div className="px-2 mx-auto max-w-7xl md:px-6 lg:px-8">
              <div className="relative flex justify-between h-16">
                <div className="absolute inset-y-0 left-0 flex items-center md:hidden">
                  {/* Mobile menu button */}
                  <Disclosure.Button className="inline-flex items-center justify-center p-2 text-gray-400 rounded-md hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <svg className="block w-6 h-6" aria-hidden="true">
                        <use href={`${x}#x`} />
                      </svg>
                    ) : (
                      <svg className="block w-6 h-6" aria-hidden="true">
                        <use href={`${menu}#menu`} />
                      </svg>
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="md:hidden">
              <div>
                <div className="px-4 pb-6">
                  <h1 className="mb-4 text-lg font-medium">
                    {/* @ts-expect-error this check happens above so im not sure why it's complaining here... */}
                    {data.user.fullName}
                  </h1>

                  <form method="get">
                    <fieldset>
                      <div>
                        <div>Filter by brand:</div>
                        <ul className="pb-4">
                          {data.brands.map(brand => (
                            <li key={brand.id}>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  name="brand"
                                  defaultChecked={data.selectedBrands.includes(
                                    brand.slug
                                  )}
                                  value={brand.slug}
                                  className="rounded-full"
                                />
                                <span>{brand.name}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div>Sort by:</div>
                        <ul className="pb-4">
                          {sortOptions.map(sort => (
                            <li key={sort.value}>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name="sort"
                                  defaultChecked={
                                    data.sort
                                      ? data.sort.includes(sort.value)
                                      : false
                                  }
                                  value={sort.value}
                                  className="rounded-full"
                                />
                                <span>{sort.display}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </fieldset>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm text-white bg-purple-600 rounded"
                    >
                      Apply
                    </button>
                  </form>
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <aside className="md:sticky md:top-0 md:h-full md:w-[275px] md:px-4 md:py-6 hidden md:block">
        <h1 className="mb-4 text-xl font-medium">{data.user.fullName}</h1>

        <form method="get">
          <fieldset className="space-y-2">
            <div>
              <div>Filter by brand:</div>
              <ul className="pb-4 my-1 space-y-1">
                {data.brands.map(brand => (
                  <li key={brand.id}>
                    <label className="flex items-center py-0.5 space-x-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        name="brand"
                        defaultChecked={data.selectedBrands.includes(
                          brand.slug
                        )}
                        value={brand.slug}
                        className="rounded-full"
                      />
                      <span>{brand.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div>Sort by:</div>
              <ul className="pb-4">
                {sortOptions.map(sort => (
                  <li key={sort.value}>
                    <label className="py-0.5 cursor-pointer flex items-center space-x-2">
                      <input
                        type="radio"
                        name="sort"
                        defaultChecked={
                          data.sort ? data.sort.includes(sort.value) : false
                        }
                        value={sort.value}
                        className="rounded-full"
                      />
                      <span>{sort.display}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </fieldset>
          <button
            type="submit"
            className="px-4 py-2 text-sm text-white bg-purple-600 rounded"
          >
            Apply
          </button>
        </form>
      </aside>

      <main className="w-full h-full">
        <ul className="grid grid-cols-2 px-4 py-6 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
          {data.user.sneakers.map(sneaker => (
            <SneakerCard key={sneaker.id} {...sneaker} />
          ))}
        </ul>
      </main>
    </div>
  );
};

export default UserSneakersPage;
export { loader, meta };
