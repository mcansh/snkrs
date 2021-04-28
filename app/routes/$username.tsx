import * as React from 'react';
import type {
  RouteComponent,
  LoaderFunction,
  LinksFunction,
} from '@remix-run/node';
import { json } from '@remix-run/node';
import { block, useRouteData } from '@remix-run/react';
import type { Brand, User } from '@prisma/client';
import { Link, Outlet, useSearchParams } from 'react-router-dom';
import uniqBy from 'lodash.uniqby';
import { Dialog, Transition } from '@headlessui/react';

import x from '../icons/outline/x.svg';
import menuAlt2 from '../icons/outline/menu-alt-2.svg';
import { prisma } from '../db';
import { NotFoundError } from '../errors';

import FourOhFour from './404';

interface RouteData {
  brands: Array<Brand>;
  user: Pick<User, 'username' | 'id'> & {
    fullName: string;
  };
}

const links: LinksFunction = () => [
  block({
    rel: 'preload',
    href: x,
    as: 'image',
    type: 'image/svg+xml',
  }),
  block({
    rel: 'preload',
    href: menuAlt2,
    as: 'image',
    type: 'image/svg+xml',
  }),
];

const loader: LoaderFunction = async ({ params }) => {
  try {
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
        },
      },
    });

    if (!user) {
      throw new NotFoundError();
    }

    const uniqueBrands = uniqBy(
      user.sneakers.map(sneaker => sneaker.brand),
      'name'
    ).sort((a, b) => a.name.localeCompare(b.name));

    return {
      user: {
        ...user,
        fullName: `${user.givenName} ${user.familyName}`,
      },
      brands: uniqueBrands,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return json({ notFound: true }, { status: 404 });
    }
    console.error(error);
    return json({}, { status: 500 });
  }
};

const sortOptions = [
  { value: 'desc', display: 'Recent first' },
  { value: 'asc', display: 'Oldest first' },
];

const UserSneakersPage: RouteComponent = () => {
  const data = useRouteData<RouteData>();
  const [search] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  if (!data.user) {
    return <FourOhFour />;
  }

  const brandQuery = search.get('brand');
  const brandQueryItems = brandQuery ? brandQuery.split(',') : [];
  const selectedBrands = brandQueryItems
    ? data.brands.filter(brand => brandQueryItems.includes(brand.slug))
    : [];

  const selectedBrandSlugs = selectedBrands.map(brand => brand.slug);

  const sortQuery = search.get('sort') ?? 'desc';

  return (
    <div className="h-full grid-cols-[200px,1fr] block md:grid">
      <Transition.Root show={sidebarOpen} as={React.Fragment}>
        <Dialog
          as="div"
          static
          className="fixed inset-0 z-40 flex md:hidden"
          open={sidebarOpen}
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={React.Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>
          <Transition.Child
            as={React.Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="relative flex flex-col flex-1 w-full max-w-xs pt-5 pb-4 bg-indigo-700">
              <Transition.Child
                as={React.Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute top-0 right-0 pt-2 -mr-12">
                  <button
                    type="button"
                    className="flex items-center justify-center w-10 h-10 ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <svg className="w-6 h-6 text-white" aria-hidden="true">
                      <use href={`${x}#x`} />
                    </svg>
                  </button>
                </div>
              </Transition.Child>
              <div className="flex-1 h-0 mt-5 overflow-y-auto">
                <div className="space-y-10">
                  <div>
                    <p>Filter by brand</p>
                    <ul>
                      {data.brands.map(brand => (
                        <li key={brand.id}>
                          <Link
                            to={{
                              search: `?brand=${[
                                ...selectedBrandSlugs,
                                brand.slug,
                              ].join()}&sort=${sortQuery}`,
                            }}
                            className="space-x-2"
                          >
                            <input
                              className="rounded-full"
                              type="checkbox"
                              value={brand.slug}
                              defaultChecked={selectedBrandSlugs.includes(
                                brand.slug
                              )}
                            />
                            <span>{brand.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p>Sort by</p>
                    <ul>
                      {sortOptions.map(option => (
                        <li key={option.value}>
                          <Link
                            to={{
                              search: `?brand=${brandQuery}&sort=${option.value}`,
                            }}
                            className="space-x-2"
                          >
                            <input
                              className="rounded-full"
                              type="checkbox"
                              value={option.value}
                              defaultChecked={sortQuery === option.value}
                            />
                            <span>{option.display}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
          <div className="flex-shrink-0 w-14" aria-hidden="true">
            {/* Dummy element to force sidebar to shrink to fit close icon */}
          </div>
        </Dialog>
      </Transition.Root>

      <div className="flex flex-col flex-1 overflow-hidden md:hidden">
        <div className="relative z-10 flex flex-shrink-0 h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 text-gray-500 border-r border-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="w-6 h-6" aria-hidden="true">
              <use href={`${menuAlt2}#menu-alt-2`} />
            </svg>
          </button>
        </div>
      </div>

      <aside className="hidden w-full px-4 py-6 bg-blue-50 md:block">
        <div className="space-y-10 md:sticky top-6">
          <div>
            <p>Filter by brand</p>
            <ul>
              {data.brands.map(brand => (
                <li key={brand.id}>
                  <Link
                    to={{
                      search: `?brand=${[
                        ...selectedBrandSlugs,
                        brand.slug,
                      ].join()}&sort=${sortQuery}`,
                    }}
                    className="space-x-2"
                  >
                    <input
                      className="rounded-full"
                      type="checkbox"
                      value={brand.slug}
                      defaultChecked={selectedBrandSlugs.includes(brand.slug)}
                    />
                    <span>{brand.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p>Sort by</p>
            <ul>
              {sortOptions.map(option => (
                <li key={option.value}>
                  <Link
                    to={{
                      search: `?brand=${brandQuery}&sort=${option.value}`,
                    }}
                    className="space-x-2"
                  >
                    <input
                      className="rounded-full"
                      type="checkbox"
                      value={option.value}
                      defaultChecked={sortQuery === option.value}
                    />
                    <span>{option.display}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default UserSneakersPage;
export { links, loader };
