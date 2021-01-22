import React from 'react';
import { useRouteData } from '@remix-run/react';
import type { Sneaker as SneakerType } from '@prisma/client';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import { Listbox } from '@headlessui/react';
import type { Loader } from '@remix-run/data';
import { json } from '@remix-run/data';

import { Sneaker } from '../components/sneaker';
import { ChevronDownIcon } from '../components/icons/chevron-down';
import { CheckmarkIcon } from '../components/icons/checkmark';
import type { Context } from '../db';
import { NotFoundError } from '../errors';

import FourOhFour, { meta as fourOhFourMeta } from './404';

interface Props {
  brands: Array<string>;
  user: {
    username: string;
    name: string;
    sneakers: Array<SneakerType>;
  };
}

const meta = ({ data }: { data: Props }) => {
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

const loader: Loader = async ({ context, params }) => {
  const { username } = params;
  const { prisma } = context as Context;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        name: true,
        username: true,
        sneakers: { orderBy: { purchaseDate: 'desc' } },
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

    const body = JSON.stringify({ user, brands: uniqueBrands });

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control':
          'max-age=300, s-maxage=600, stale-while-revalidate=31536000',
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return new Response(JSON.stringify({}), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return json({}, { status: 500 });
  }
};

const Index = () => {
  const { user, brands } = useRouteData<Props>();
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
      <h1 className="pb-2 text-xl sm:text-4xl">
        Sneaker Collection – {user.sneakers.length} and counting
      </h1>

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
export { meta, loader };
