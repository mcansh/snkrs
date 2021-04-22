import React from 'react';
import type { HeadersFunction } from '@remix-run/react';
import { block, useRouteData } from '@remix-run/react';
import type { Sneaker as SneakerType } from '@prisma/client';
import { useNavigate } from 'react-router';
import { Link, useSearchParams } from 'react-router-dom';
import { Listbox } from '@headlessui/react';
import type { LinksFunction, LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';

import { Sneaker } from '../components/sneaker';
import { ChevronDownIcon } from '../components/icons/chevron-down';
import { CheckmarkIcon } from '../components/icons/checkmark';
import { prisma } from '../db';
import { NotFoundError } from '../errors';
import { getSession } from '../session';
import { sessionKey } from '../constants';
import plusCircle from '../icons/plus-circle.svg';

import FourOhFour, { meta as fourOhFourMeta } from './404';

interface RouteData {
  brands: Array<string>;
  user: {
    username: string;
    name: string;
    sneakers: Array<SneakerType>;
    id: string;
  };
  isCurrentUser: boolean;
}

const links: LinksFunction = () => [
  block({
    rel: 'preload',
    href: plusCircle,
    as: 'image',
    type: 'image/svg+xml',
  }),
];

const meta = ({ data }: { data: RouteData }) => {
  if (!data.user) {
    return fourOhFourMeta();
  }

  const usernameEndsWithS = data.user.name.toLowerCase().endsWith('s');

  const usernameWithApostrophe = usernameEndsWithS
    ? `${data.user.name}'`
    : `${data.user.name}'s`;

  return {
    title: `Home | ${usernameWithApostrophe} Sneaker Collection`,
    description: `${usernameWithApostrophe} sneaker collection`,
  };
};

const headers: HeadersFunction = ({ loaderHeaders }) => ({
  'Cache-Control': loaderHeaders.get('Cache-Control') ?? 'no-cache',
});

const loader: LoaderFunction = async ({ request, params }) => {
  const session = await getSession(request.headers.get('Cookie'));
  const userID = session.get(sessionKey);
  const { username } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        name: true,
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

    return json(
      { brands: uniqueBrands, user, isCurrentUser: user.id === userID },
      {
        headers: {
          'Cache-Control': `max-age=300, s-maxage=31536000, stale-while-revalidate=31536000`,
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
};

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
        <p>No sneakers</p>
      </div>
    );
  }

  const sorted =
    sortQuery && sortQuery === 'asc'
      ? [...user.sneakers].reverse()
      : user.sneakers;

  return (
    <main className="container min-h-full p-4 mx-auto">
      <div className="flex items-center justify-between pb-2 space-x-2">
        <h1 className="text-xl sm:text-4xl">
          Sneaker Collection – {user.sneakers.length} and counting
        </h1>
        {isCurrentUser && (
          <Link to="/sneakers/add">
            <span className="sr-only">Add to collection</span>
            <svg className="w-6 h-6 text-purple-600">
              <use href={`${plusCircle}#plusCircle`} />
            </svg>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2 sm:gap-3 md:gap-4">
        <div>
          <Listbox
            value={undefined}
            onChange={selectedBrand =>
              navigate(((selectedBrand as unknown) as string).toLowerCase())
            }
          >
            <Listbox.Button className="flex justify-between w-full px-3 py-2 text-left bg-white rounded-lg">
              Filter by brand{' '}
              <ChevronDownIcon className="w-6 text-purple-600" />
            </Listbox.Button>
            <Listbox.Options>
              {brands.map(brand => (
                <Listbox.Option as={React.Fragment} key={brand} value={brand}>
                  {({ active, selected }) => (
                    <li
                      className={`${
                        active
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-black'
                      }`}
                    >
                      {selected && <CheckmarkIcon />}
                      {brand}
                    </li>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Listbox>
        </div>

        <div>
          <Listbox
            value={undefined}
            onChange={newSort =>
              navigate({
                pathname: './',
                search: `?sort=${newSort}`,
              })
            }
          >
            <Listbox.Button className="flex justify-between w-full px-3 py-2 text-left bg-white rounded-lg">
              {sortQuery ?? 'Sort'}{' '}
              <ChevronDownIcon className="w-6 text-purple-600" />
            </Listbox.Button>
            <Listbox.Options>
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
                      className={`${
                        active
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-black'
                      }`}
                    >
                      {selected && <CheckmarkIcon />}
                      {sortChoice.display}
                    </li>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Listbox>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4 sm:grid-cols-2 md:grid-cols-4">
        {sorted.map(sneaker => (
          <Sneaker key={sneaker.id} {...sneaker} />
        ))}
      </ul>
    </main>
  );
};

export default Index;
export { headers, links, loader, meta };
