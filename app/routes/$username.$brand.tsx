import React from 'react';
import { useRouteData } from '@remix-run/react';
import type { Sneaker as SneakerType } from '@prisma/client';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Listbox, Transition } from '@headlessui/react';
import clsx from 'clsx';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Sneaker } from '../components/sneaker';
import { NotFoundError } from '../errors';
import { prisma } from '../db';
import selectorIcon from '../icons/outline/selector.svg';
import checkIcon from '../icons/outline/check.svg';

import FourOhFour, { meta as fourOhFourMeta } from './404';

interface Props {
  sneakers: SneakerType[];
  selectedBrand: string;
  brands: Array<string>;
  user: {
    username: string;
    givenName: string;
    familyName: string;
  };
}

const loader: LoaderFunction = async ({ params }) => {
  const { brand, username } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        givenName: true,
        familyName: true,
        username: true,
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundError();
    }

    const [sneakers, allSneakers] = await Promise.all([
      prisma.sneaker.findMany({
        where: {
          User: { id: user.id },
          brand: {
            equals: brand,
            mode: 'insensitive',
          },
        },
        orderBy: { purchaseDate: 'desc' },
      }),
      prisma.sneaker.findMany({
        where: { User: { username } },
        select: { brand: true },
      }),
    ]);

    const uniqueBrands = [
      ...new Set<string>(
        allSneakers
          .sort((a, b) => a.brand.localeCompare(b.brand))
          .map(sneaker => sneaker.brand)
      ),
    ];

    return json({
      brands: ['Show All', ...uniqueBrands],
      sneakers,
      user,
      selectedBrand: sneakers[0].brand ?? brand,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return json({}, { status: 404 });
    }
    console.error(error);
    return json({}, { status: 500 });
  }
};

const meta = ({ data }: { data: Props }) => {
  if (!data.user) {
    return fourOhFourMeta();
  }

  const fullName = `${data.user.givenName} ${data.user.familyName}`;
  const usernameEndsWithS = fullName.toLowerCase().endsWith('s');

  const usernameWithApostrophe = usernameEndsWithS
    ? `${fullName}'`
    : `${fullName}'s`;

  return {
    title: `${data.selectedBrand} | ${usernameWithApostrophe} Sneaker Collection`,
    description: `${usernameWithApostrophe} ${data.selectedBrand} sneaker collection`,
  };
};

const sortOptions = [
  { value: 'desc', display: 'Recent first' },
  { value: 'asc', display: 'Oldest first' },
];

const UserSneakerBrandPage = () => {
  const { user, sneakers, selectedBrand, brands } = useRouteData<Props>();
  const navigate = useNavigate();
  const [search] = useSearchParams();

  if (!user) {
    return <FourOhFour />;
  }

  if (!sneakers.length) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        <p>No sneakers</p>
      </div>
    );
  }

  const sortQuery = search.get('sort');
  const sort = sortOptions.find(s => s.value === sortQuery) ?? sortOptions[0];
  const sorted = sortQuery === 'asc' ? [...sneakers].reverse() : sneakers;

  return (
    <div className="container min-h-full p-4 pb-6 mx-auto">
      <h1 className="pb-2 text-xl xs:text-2xl sm:text-4xl">
        {selectedBrand} Sneaker Collection – {sneakers.length} and counting
      </h1>

      <div className="grid grid-cols-2 gap-2 mb-2 sm:gap-3 md:gap-4">
        <Listbox
          value={selectedBrand}
          onChange={newBrand => {
            if (newBrand === 'Show All') {
              return navigate(`/${user.username}`);
            }
            return navigate(`/${user.username}/${newBrand.toLowerCase()}`);
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

export default UserSneakerBrandPage;
export { meta, loader };
