import * as React from 'react';
import type {
  HeadersFunction,
  LoaderFunction,
  MetaFunction,
} from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
  Form,
  Link,
  useLoaderData,
  useNavigate,
  useSearchParams,
  useSubmit,
} from '@remix-run/react';
import { Prisma } from '@prisma/client';
import uniqBy from 'lodash.uniqby';
import { Dialog, Disclosure, Menu, Transition } from '@headlessui/react';
import type { User } from '@prisma/client';
import clsx from 'clsx';
import { route } from 'routes-gen';

import { prisma } from '~/db.server';
import x from '~/icons/outline/x.svg';
import chevronDown from '~/icons/solid/chevron-down.svg';
import filter from '~/icons/solid/filter.svg';
import minusSm from '~/icons/solid/minus-sm.svg';
import plusSm from '~/icons/solid/plus-sm.svg';
import { SneakerCard } from '~/components/sneaker';
import { getUserId, sessionStorage } from '~/session.server';
import type { Maybe } from '~/@types/types';
import { getSeoMeta } from '~/seo';

let userWithSneakers = Prisma.validator<Prisma.UserArgs>()({
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

type Filter = {
  id: string;
  name: string;
  options: Array<{ value: string; label: string; checked: boolean }>;
};

export interface RouteData {
  filters: Array<Filter>;
  user: UserWithSneakers;
  sort: 'asc' | 'desc';
  sessionUser?: Maybe<Pick<User, 'givenName' | 'id'>> | null;
  settings: {
    showPurchasePrice: boolean;
  };
}

export let loader: LoaderFunction = async ({ params, request }) => {
  let session = await sessionStorage.getSession(request.headers.get('Cookie'));
  let url = new URL(request.url);
  let userId = await getUserId(request);

  let selectedBrands = url.searchParams.getAll('brand');
  let sortQuery = url.searchParams.get('sort');
  let sort: Prisma.SortOrder = sortQuery === 'asc' ? 'asc' : 'desc';

  let user = await prisma.user.findUnique({
    where: {
      username: params.username,
    },
    select: {
      username: true,
      id: true,
      fullName: true,
      sneakers: {
        include: { brand: true },
        orderBy: { purchaseDate: sort },
      },
    },
  });

  if (!user) {
    throw new Response("This user doesn't exist", { status: 404 });
  }

  let settings = await prisma.settings.findUnique({
    where: { userId: user.id },
  });

  let sessionUser = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: {
          givenName: true,
          id: true,
        },
      })
    : null;

  let sneakers = selectedBrands.length
    ? user.sneakers.filter(sneaker =>
        selectedBrands.includes(sneaker.brand.slug)
      )
    : user.sneakers;

  let uniqueBrands = uniqBy(
    user.sneakers.map(sneaker => sneaker.brand),
    'name'
  ).sort((a, b) => a.name.localeCompare(b.name));

  if (
    uniqueBrands.length > 0 &&
    uniqueBrands.every(brand => selectedBrands.includes(brand.slug))
  ) {
    url.searchParams.delete('brand');
    throw redirect(url.toString());
  }

  return json<RouteData>(
    {
      user: { ...user, sneakers },
      filters: [
        {
          id: 'brand',
          name: 'Brand',
          options: uniqueBrands.map(brand => {
            return {
              value: brand.slug,
              label: brand.name,
              checked: selectedBrands.includes(brand.slug),
            };
          }),
        },
      ],
      sort: sortQuery === 'asc' ? 'asc' : 'desc',
      sessionUser,
      settings: {
        showPurchasePrice: settings?.showPurchasePrice ?? false,
      },
    },
    {
      headers: {
        'Set-Cookie': sessionUser
          ? await sessionStorage.commitSession(session)
          : '',
      },
    }
  );
};

export let headers: HeadersFunction = ({ loaderHeaders }) => ({
  'Server-Timing': loaderHeaders.get('Server-Timing') ?? '',
});

export let meta: MetaFunction = ({ data }: { data: RouteData | null }) => {
  if (!data?.user) {
    return getSeoMeta({
      title: "Ain't nothing here",
    });
  }

  let name = `${data.user.fullName}${
    data.user.fullName.endsWith('s') ? "'" : "'s"
  }`;

  return getSeoMeta({
    title: `${name} Sneaker Collection`,
    description: `${name} sneaker collection`,
    twitter: {
      card: 'summary_large_image',
      site: '@loganmcansh',
      // TODO: add support for linking your twitter account
      creator: '@loganmcansh',
      description: `${name} sneaker collection`,
      // TODO: add support for user avatar
    },
  });
};

let sortOptions = [
  { value: 'desc', display: 'Recent first' },
  { value: 'asc', display: 'Oldest first' },
];

export default function UserSneakersPage() {
  let data = useLoaderData<RouteData>();
  let submit = useSubmit();
  let [searchParams] = useSearchParams();
  let navigate = useNavigate();
  let mobileFiltersOpen = searchParams.get('filter-open') === 'true';

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
          to={route('/sneakers/add')}
        >
          Add a sneaker to your collection
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile filter dialog */}
      <Transition.Root show={mobileFiltersOpen} as={React.Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 flex z-40 lg:hidden"
          onClose={() => {
            searchParams.delete('filter-open');
            navigate({ search: searchParams.toString() });
          }}
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
            <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <Transition.Child
            as={React.Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <div className="ml-auto relative max-w-xs w-full h-full bg-white shadow-xl py-4 pb-12 flex flex-col overflow-y-auto">
              <div className="px-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                <Link
                  replace
                  to={{
                    search: new URLSearchParams({
                      ...Object.fromEntries(searchParams),
                      'filter-open': 'false',
                    }).toString(),
                  }}
                  className="-mr-2 w-10 h-10 bg-white p-2 rounded-md flex items-center justify-center text-gray-400"
                >
                  <span className="sr-only">Close menu</span>
                  <svg className="h-6 w-6" aria-hidden="true">
                    <use href={`${x}#x`} />
                  </svg>
                </Link>
              </div>

              {/* Filters */}
              <Form
                className="mt-4 border-t border-gray-200"
                onChange={event => {
                  submit(event.currentTarget, { replace: true });
                }}
              >
                {data.filters.map(section => (
                  <Disclosure
                    as="div"
                    key={section.id}
                    className="border-t border-gray-200 px-4 py-6"
                  >
                    {({ open }) => (
                      <>
                        <h3 className="-mx-2 -my-3 flow-root">
                          <Disclosure.Button className="px-2 py-3 bg-white w-full flex items-center justify-between text-gray-400 hover:text-gray-500">
                            <span className="font-medium text-gray-900">
                              {section.name}
                            </span>
                            <span className="ml-6 flex items-center">
                              {open ? (
                                <svg className="h-5 w-5" aria-hidden="true">
                                  <use href={`${minusSm}#minus-sm`} />
                                </svg>
                              ) : (
                                <svg className="h-5 w-5" aria-hidden="true">
                                  <use href={`${plusSm}#plus-sm`} />
                                </svg>
                              )}
                            </span>
                          </Disclosure.Button>
                        </h3>
                        <Disclosure.Panel className="pt-6">
                          <div className="space-y-6">
                            {section.options.map(option => (
                              <div
                                key={option.value}
                                className="flex items-center"
                              >
                                <input
                                  id={`filter-mobile-${section.id}-${option.label}`}
                                  name={`${section.id}`}
                                  defaultValue={option.value}
                                  type="checkbox"
                                  defaultChecked={option.checked}
                                  className="h-4 w-4 border-gray-300 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <label
                                  htmlFor={`filter-mobile-${section.id}-${option.label}`}
                                  className="ml-3 min-w-0 flex-1 text-gray-500"
                                >
                                  {option.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure>
                ))}

                <div className="px-4">
                  <button
                    type="submit"
                    className="mt-8 w-full bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Apply
                  </button>
                </div>
              </Form>
            </div>
          </Transition.Child>
        </Dialog>
      </Transition.Root>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 flex items-baseline justify-between pt-24 pb-6 border-b border-gray-200">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            {data.user.fullName}
          </h1>

          <div className="flex items-center">
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="group inline-flex justify-center text-sm font-medium text-gray-700 hover:text-gray-900">
                  Sort
                  <svg
                    className="flex-shrink-0 -mr-1 ml-1 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                    aria-hidden="true"
                  >
                    <use href={`${chevronDown}#chevron-down`} />
                  </svg>
                </Menu.Button>
              </div>

              <Transition
                as={React.Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-2xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    {sortOptions.map(option => (
                      <Menu.Item key={option.display}>
                        {({ active }) => (
                          <Link
                            replace
                            to={{
                              search: new URLSearchParams({
                                ...Object.fromEntries(searchParams.entries()),
                                sort: option.value,
                              }).toString(),
                            }}
                            className={clsx(
                              data.sort === option.value
                                ? 'font-medium text-gray-900'
                                : 'text-gray-500',
                              active ? 'bg-gray-100' : '',
                              'block px-4 py-2 text-sm'
                            )}
                          >
                            {option.display}
                          </Link>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            <Link
              replace
              to={{
                search: new URLSearchParams({
                  ...Object.fromEntries(searchParams.entries()),
                  'filter-open': 'true',
                }).toString(),
              }}
              className="p-2 -m-2 ml-4 sm:ml-6 text-gray-400 hover:text-gray-500 lg:hidden"
            >
              <span className="sr-only">Filters</span>
              <svg className="w-5 h-5" aria-hidden="true">
                <use href={`${filter}#filter`} />
              </svg>
            </Link>
          </div>
        </div>

        <section aria-labelledby="products-heading" className="pt-6 pb-24">
          <h2 id="products-heading" className="sr-only">
            Products
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-8 gap-y-10 lg:items-start">
            {/* Filters */}
            <Form
              className="hidden lg:block lg:sticky lg:top-0"
              onChange={event => {
                submit(event.currentTarget, { replace: true });
              }}
            >
              {data.filters.map(section => (
                <Disclosure
                  as="div"
                  key={section.id}
                  className="border-b border-gray-200 py-6"
                >
                  {({ open }) => (
                    <>
                      <h3 className="-my-3 flow-root">
                        <Disclosure.Button className="py-3 bg-white w-full flex items-center justify-between text-sm text-gray-400 hover:text-gray-500">
                          <span className="font-medium text-gray-900">
                            {section.name}
                          </span>
                          <span className="ml-6 flex items-center">
                            {open ? (
                              <svg className="h-5 w-5" aria-hidden="true">
                                <use href={`${minusSm}#minus-sm`} />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5" aria-hidden="true">
                                <use href={`${plusSm}#plus-sm`} />
                              </svg>
                            )}
                          </span>
                        </Disclosure.Button>
                      </h3>
                      <Disclosure.Panel className="pt-6">
                        <div className="space-y-4">
                          {section.options.map((option, optionIdx) => (
                            <div
                              key={option.value}
                              className="flex items-center"
                            >
                              <input
                                id={`filter-${section.id}-${optionIdx}`}
                                name={`${section.id}`}
                                defaultValue={option.value}
                                type="checkbox"
                                defaultChecked={option.checked}
                                className="h-4 w-4 border-gray-300 rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <label
                                htmlFor={`filter-${section.id}-${optionIdx}`}
                                className="ml-3 text-sm text-gray-600"
                              >
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>
              ))}

              <button
                type="submit"
                className="mt-8 w-full bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Apply
              </button>
            </Form>

            {/* Product grid */}
            <div className="lg:col-span-3">
              {data.user.sneakers.length === 0 ? (
                <div className="px-6">
                  <h1 className="text-2xl font-medium">
                    {data.user.fullName} has no sneakers in their collection
                  </h1>
                </div>
              ) : (
                <ul className="grid grid-cols-2 px-4 py-6 gap-x-4 gap-y-8 lg:grid-cols-4">
                  {data.user.sneakers.map(sneaker => (
                    <SneakerCard
                      key={sneaker.id}
                      {...sneaker}
                      showPurchasePrice={data.settings.showPurchasePrice}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
