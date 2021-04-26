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
import chevronDownIcon from '../icons/outline/chevron-down.svg';
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
    href: chevronDownIcon,
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
        { brands: uniqueBrands, user, isCurrentUser },
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

const Index = () => {
  const { isCurrentUser, user, brands } = useRouteData<RouteData>();
  const navigate = useNavigate();

  const [search] = useSearchParams();
  const sortQuery = search.get('sort');

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

  const sorted =
    sortQuery && sortQuery === 'asc'
      ? [...user.sneakers].reverse()
      : user.sneakers;

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
          value={undefined}
          onChange={selectedBrand => {
            navigate(((selectedBrand as unknown) as string).toLowerCase());
          }}
        >
          {({ open }) => (
            <div className="relative">
              <Listbox.Button className="flex justify-between w-full px-3 py-2 text-left bg-white rounded-lg">
                Filter by brand{' '}
                <svg className="w-6 h-6 text-purple-600">
                  <use href={`${chevronDownIcon}#chevron-down`} />
                </svg>
              </Listbox.Button>

              <Transition
                show={open}
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
                as={React.Fragment}
              >
                <Listbox.Options
                  static
                  className="divide-y absolute z-10 w-full bg-white top-[50px] rounded-lg shadow-xl overflow-hidden"
                >
                  {brands.map(brand => (
                    <Listbox.Option
                      key={brand}
                      value={brand}
                      as={React.Fragment}
                    >
                      {({ active, selected }) => (
                        <li
                          className={clsx(
                            'cursor-pointer px-3 py-1 flex items-center justify-between',
                            active
                              ? 'bg-blue-500 text-white'
                              : 'bg-white text-black'
                          )}
                        >
                          {brand}
                          {selected && (
                            <svg className="w-6 h-6">
                              <use href={`${checkIcon}#check`} />
                            </svg>
                          )}
                        </li>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          )}
        </Listbox>

        <Listbox
          value={sortQuery}
          onChange={newSort =>
            navigate({
              pathname: './',
              search: `?sort=${newSort}`,
            })
          }
        >
          {({ open }) => (
            <div className="relative">
              <Listbox.Button className="flex justify-between w-full px-3 py-2 text-left bg-white rounded-lg">
                {sortQuery ?? 'Sort'}{' '}
                <svg className="w-6 h-6 text-purple-600">
                  <use href={`${chevronDownIcon}#chevron-down`} />
                </svg>
              </Listbox.Button>

              <Transition
                show={open}
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
                as={React.Fragment}
              >
                <Listbox.Options
                  static
                  className="divide-y absolute z-10 w-full bg-white top-[50px] rounded-lg shadow-xl overflow-hidden"
                >
                  {[
                    { value: 'desc', display: 'Recent first' },
                    { value: 'asc', display: 'Oldest first' },
                  ].map(sortChoice => (
                    <Listbox.Option
                      as={React.Fragment}
                      key={sortChoice.value}
                      value={sortChoice.value}
                    >
                      {({ active, selected }) => (
                        <li
                          className={clsx(
                            'cursor-pointer px-3 py-1 flex items-center justify-between',
                            active
                              ? 'bg-blue-500 text-white'
                              : 'bg-white text-black'
                          )}
                        >
                          {sortChoice.display}
                          {selected && (
                            <svg className="w-6 h-6">
                              <use href={`${checkIcon}#check`} />
                            </svg>
                          )}
                        </li>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          )}
        </Listbox>
      </div>

      <ul className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4 sm:grid-cols-2 md:grid-cols-4">
        {sorted.map(sneaker => (
          <Sneaker key={sneaker.id} {...sneaker} />
        ))}
      </ul>
    </div>
  );
};

export default Index;
export { headers, links, loader, meta };
