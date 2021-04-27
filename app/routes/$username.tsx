import React from 'react';
import type { HeadersFunction } from '@remix-run/react';
import { block, useRouteData } from '@remix-run/react';
import type { Sneaker as SneakerType, User } from '@prisma/client';
import { useNavigate } from 'react-router';
import { Link, useSearchParams } from 'react-router-dom';
import { Listbox, Transition } from '@headlessui/react';
import type { LinksFunction, LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import clsx from 'clsx';

import { Sneaker } from '../components/sneaker';
import { prisma } from '../db';
import { NotFoundError } from '../errors';
import { sessionKey } from '../constants';
import { withSession } from '../lib/with-session';
import plusCircleIcon from '../icons/outline/plus-circle.svg';
import selectorIcon from '../icons/outline/selector.svg';
import checkIcon from '../icons/outline/check.svg';

import FourOhFour, { meta as fourOhFourMeta } from './404';

interface RouteData {
  brands: Array<string>;
  user: Pick<
    User & { sneakers: Array<SneakerType> },
    'username' | 'familyName' | 'givenName' | 'sneakers' | 'id'
  >;
  isCurrentUser: boolean;
}

const links: LinksFunction = () => [
  block({
    rel: 'preload',
    href: plusCircleIcon,
    as: 'image',
    type: 'image/svg+xml',
  }),
  block({
    rel: 'preload',
    href: selectorIcon,
    as: 'image',
    type: 'image/svg+xml',
  }),
  block({
    rel: 'preload',
    href: checkIcon,
    as: 'image',
    type: 'image/svg+xml',
  }),
];

const meta = ({ data }: { data: RouteData }) => {
  if (!data.user) {
    return fourOhFourMeta();
  }

  const fullName = `${data.user.givenName} ${data.user.familyName}`;

  const usernameEndsWithS = fullName.toLowerCase().endsWith('s');

  const nameEndsWithS = usernameEndsWithS ? `${fullName}'` : `${fullName}'s`;

  return {
    title: `Home | ${nameEndsWithS} Sneaker Collection`,
    description: `${nameEndsWithS} sneaker collection`,
  };
};

const headers: HeadersFunction = ({ loaderHeaders }) => ({
  'Cache-Control': loaderHeaders.get('Cache-Control') ?? 'no-cache',
});

const loader: LoaderFunction = ({ request, params }) =>
  withSession(request, async session => {
    const userID = session.get(sessionKey);
    const { username } = params;

    try {
      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          givenName: true,
          familyName: true,
          username: true,
          sneakers: { orderBy: { purchaseDate: 'desc' } },
          id: true,
        },
      });

      if (!user) {
        throw new NotFoundError();
      }

      const uniqueBrands = [
        ...new Set<string>(
          [...user.sneakers]
            .sort((a, b) => a.brand.localeCompare(b.brand))
            .map(sneaker => sneaker.brand)
        ),
      ];

      const isCurrentUser = user.id === userID;

      return json(
        { brands: ['Show All', ...uniqueBrands], user, isCurrentUser },
        {
          headers: {
            'Cache-Control': isCurrentUser
              ? `max-age=60`
              : `max-age=300, s-maxage=31536000, stale-while-revalidate=31536000`,
          },
        }
      );
    } catch (error) {
      if (error instanceof NotFoundError) {
        return json({}, { status: 404 });
      }
      console.error(error);
      return json({}, { status: 500 });
    }
  });

const sortOptions = [
  { value: 'desc', display: 'Recent first' },
  { value: 'asc', display: 'Oldest first' },
];

const UserSneakersPage = () => {
  const { isCurrentUser, user, brands } = useRouteData<RouteData>();
  const navigate = useNavigate();
  const [search] = useSearchParams();

  if (!user) {
    return <FourOhFour />;
  }

  if (!user.sneakers.length) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        {isCurrentUser ? (
          <Link to="/sneakers/add" className="text-purple-600">
            Add a pair to your collection
          </Link>
        ) : (
          <p>No sneakers</p>
        )}
      </div>
    );
  }

  const selectedBrand = 'Show All';
  const sortQuery = search.get('sort');
  const sort = sortOptions.find(s => s.value === sortQuery) ?? sortOptions[0];
  const sorted =
    sortQuery === 'asc' ? [...user.sneakers].reverse() : user.sneakers;

  return (
    <div className="container min-h-full p-4 pb-6 mx-auto">
      <div className="flex items-center justify-between pb-2 space-x-2">
        <h1 className="text-xl xs:text-2xl sm:text-4xl">
          Sneaker Collection – {user.sneakers.length} and counting
        </h1>
        {isCurrentUser && (
          <Link to="/sneakers/add">
            <span className="sr-only">Add to collection</span>
            <svg className="w-6 h-6 text-purple-600">
              <use href={`${plusCircleIcon}#plusCircle`} />
            </svg>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2 sm:gap-3 md:gap-4">
        <Listbox
          value={selectedBrand}
          onChange={newBrand => {
            if (newBrand === 'Show All') {
              return navigate(`/${user.username}`);
            }
            return navigate(newBrand.toLowerCase());
          }}
        >
          {({ open }) => (
            <div className="relative">
              <Listbox.Button className="relative w-full py-2 pl-3 pr-10 text-left bg-white border border-gray-300 rounded-md shadow-sm cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <span className="block truncate">{selectedBrand}</span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" aria-hidden="true">
                    <use href={`${selectorIcon}#selector`} />
                  </svg>
                </span>
              </Listbox.Button>

              <Transition
                show={open}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                as={React.Fragment}
              >
                <Listbox.Options
                  static
                  className="absolute z-10 w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                >
                  {brands.map(brand => (
                    <Listbox.Option
                      key={brand}
                      value={brand}
                      className={({ active }) =>
                        clsx(
                          active ? 'text-white bg-indigo-600' : 'text-gray-900',
                          'cursor-default select-none relative py-2 pl-3 pr-9'
                        )
                      }
                    >
                      {({ active, selected }) => (
                        <>
                          <span
                            className={clsx(
                              selected ? 'font-semibold' : 'font-normal',
                              'block truncate'
                            )}
                          >
                            {brand}
                          </span>

                          {selected && (
                            <span
                              className={clsx(
                                active ? 'text-white' : 'text-indigo-600',
                                'absolute inset-y-0 right-0 flex items-center pr-4'
                              )}
                            >
                              <svg className="w-5 h-5" aria-hidden="true">
                                <use href={`${checkIcon}#check`} />
                              </svg>
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          )}
        </Listbox>

        <Listbox
          value={sort}
          onChange={newSort => navigate({ search: `?sort=${newSort}` })}
        >
          {({ open }) => (
            <div className="relative">
              <Listbox.Button className="relative w-full py-2 pl-3 pr-10 text-left bg-white border border-gray-300 rounded-md shadow-sm cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <span className="block truncate">{sort.display}</span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" aria-hidden="true">
                    <use href={`${selectorIcon}#selector`} />
                  </svg>
                </span>
              </Listbox.Button>

              <Transition
                show={open}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                as={React.Fragment}
              >
                <Listbox.Options
                  static
                  className="absolute z-10 w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                >
                  {sortOptions.map(sortOption => (
                    <Listbox.Option
                      key={sortOption.display}
                      value={sortOption.value}
                      className={({ active }) =>
                        clsx(
                          active ? 'text-white bg-indigo-600' : 'text-gray-900',
                          'cursor-default select-none relative py-2 pl-3 pr-9'
                        )
                      }
                    >
                      {({ active, selected }) => (
                        <>
                          <span
                            className={clsx(
                              selected ? 'font-semibold' : 'font-normal',
                              'block truncate'
                            )}
                          >
                            {sortOption.display}
                          </span>

                          {selected && (
                            <span
                              className={clsx(
                                active ? 'text-white' : 'text-indigo-600',
                                'absolute inset-y-0 right-0 flex items-center pr-4'
                              )}
                            >
                              <svg className="w-5 h-5" aria-hidden="true">
                                <use href={`${checkIcon}#check`} />
                              </svg>
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          )}
        </Listbox>
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
        {sorted.map(sneaker => (
          <Sneaker key={sneaker.id} {...sneaker} />
        ))}
      </ul>
    </div>
  );
};

export default UserSneakersPage;
export { headers, links, loader, meta };
