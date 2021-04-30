import * as React from 'react';
import type {
  RouteComponent,
  LoaderFunction,
  LinksFunction,
  MetaFunction,
} from 'remix';
import { json, useRouteData } from 'remix';
import type { Brand, Sneaker, User } from '@prisma/client';
import uniqBy from 'lodash.uniqby';
import { Disclosure } from '@headlessui/react';

import { prisma } from '../db';
import { NotFoundError } from '../errors';
import { DataOutlet } from '../components/data-outlet';
import x from '../icons/outline/x.svg';
import menu from '../icons/outline/menu.svg';

import FourOhFour, { meta as fourOhFourMeta } from './404';

export interface RouteData {
  brands: Array<Brand>;
  user: Pick<User, 'username' | 'id'> & {
    fullName: string;
    possessive: string;
    sneakers: Array<Sneaker & { brand: Brand }>;
  };
  selectedBrands: Array<string>;
  sort?: 'asc' | 'desc';
}

const loader: LoaderFunction = async ({ params, request }) => {
  try {
    const { searchParams } = new URL(request.url);

    const selectedBrands = searchParams.getAll('brand');
    const sortQuery = searchParams.get('sort');

    const user = await prisma.user.findUnique({
      where: {
        username: params.username,
      },
      select: {
        username: true,
        id: true,
        givenName: true,
        familyName: true,
        sneakers: {
          include: { brand: true },
          orderBy: {
            purchaseDate: sortQuery === 'asc' ? 'asc' : 'desc',
          },
        },
      },
    });

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

    const fullName = `${user.givenName} ${user.familyName}`;
    const endsPossessive = fullName.toLowerCase().endsWith('s');

    const nameEndsWithS = endsPossessive ? `${fullName}'` : `${fullName}'s`;

    return {
      user: {
        ...user,
        fullName,
        sneakers,
        possessive: nameEndsWithS,
      },
      brands: uniqueBrands,
      selectedBrands,
      sort: sortQuery === 'asc' ? 'asc' : 'desc',
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return json({ notFound: true }, { status: 404 });
    }
    console.error(error);
    return json({}, { status: 500 });
  }
};

const links: LinksFunction = () => [];

const meta: MetaFunction = ({ data }: { data: RouteData }) => {
  if (!data.user) {
    return fourOhFourMeta();
  }

  return {
    title: `${data.user.possessive} Sneaker Collection`,
    description: `${data.user.possessive} sneaker collection`,
    'twitter:card': 'summary_large_image',
    'twitter:site': '@loganmcansh',
    // TODO: add support for linking your twitter account
    'twitter:creator': '@loganmcansh',
    'twitter:description': `${data.user.possessive} sneaker collection`,
    // TODO: add support for user avatar
  };
};

const sortOptions = [
  { value: 'desc', display: 'Recent first' },
  { value: 'asc', display: 'Oldest first' },
];

const UserSneakersPage: RouteComponent = () => {
  const data = useRouteData<RouteData>();

  if (!data.user) {
    return <FourOhFour />;
  }

  return (
    <div className="h-full md:grid-cols-[275px,1fr] block md:grid">
      <Disclosure as="nav" className="bg-white shadow">
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
                <aside className="hidden md:block">
                  <div className="sticky top-0 px-4 py-6">
                    <h1 className="mb-4 text-sm font-medium">
                      {data.user.fullName}
                    </h1>

                    <form method="get">
                      <fieldset className="space-y-2">
                        <div>
                          <div>Filter by brand:</div>
                          <ul className="pb-4 my-1 space-y-1">
                            {data.brands.map(brand => (
                              <li key={brand.id}>
                                <label className="flex items-center space-x-2 text-sm cursor-pointer">
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
                </aside>
              </div>
            </div>

            <Disclosure.Panel className="md:hidden">
              <div>
                <div className="px-4 py-6">
                  <h1 className="mb-4 text-sm font-medium">
                    {data.user.fullName}
                  </h1>

                  <form method="get">
                    <fieldset className="grid grid-cols-2 gap-2">
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

      <main>
        <DataOutlet data={data} />
      </main>
    </div>
  );
};

export default UserSneakersPage;
export { links, loader, meta };
