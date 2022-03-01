import { Form, json, Link, redirect, useLoaderData, useSubmit } from 'remix';
import { Prisma } from '@prisma/client';
import uniqBy from 'lodash.uniqby';
import { Disclosure } from '@headlessui/react';
import type { Brand, User } from '@prisma/client';
import type { LoaderFunction, MetaFunction, HeadersFunction } from 'remix';
import clsx from 'clsx';

import { prisma } from '~/db.server';
import x from '~/icons/outline/x.svg';
import menu from '~/icons/outline/menu.svg';
import { sessionKey } from '~/constants';
import { SneakerCard } from '~/components/sneaker';
import { commitSession, getSession } from '~/session';
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

export interface RouteData {
  brands: Array<Brand>;
  user: UserWithSneakers;
  selectedBrands: Array<string>;
  sort: 'asc' | 'desc';
  sessionUser?: Maybe<Pick<User, 'givenName' | 'id'>> | null;
  settings: {
    showPurchasePrice: boolean;
  };
}

export let loader: LoaderFunction = async ({ params, request }) => {
  let session = await getSession(request.headers.get('Cookie'));
  let url = new URL(request.url);
  let userId = session.get(sessionKey);

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
        orderBy: {
          purchaseDate: sort,
        },
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

  if (uniqueBrands.every(brand => selectedBrands.includes(brand.slug))) {
    url.searchParams.delete('brand');
    return redirect(url.toString());
  }

  return json<RouteData>(
    {
      user: { ...user, sneakers },
      brands: uniqueBrands,
      selectedBrands,
      sort: sortQuery === 'asc' ? 'asc' : 'desc',
      sessionUser,
      settings: {
        showPurchasePrice: settings?.showPurchasePrice ?? false,
      },
    },
    {
      headers: {
        'Set-Cookie': sessionUser ? await commitSession(session) : '',
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
      <Disclosure as="nav" className="sticky top-0 bg-white shadow md:hidden">
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
                    {data.user.fullName}
                  </h1>

                  <Form
                    method="get"
                    onChange={event => submit(event.currentTarget)}
                  >
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
                                  defaultChecked={data.sort.includes(
                                    sort.value
                                  )}
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
                    <noscript>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm text-white bg-purple-600 rounded"
                      >
                        Apply
                      </button>
                    </noscript>
                  </Form>
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <aside className="md:sticky md:top-0 md:h-screen md:w-[275px] md:px-4 md:py-6 hidden md:block overflow-y-auto">
        <h1 className="mb-4 text-xl font-medium">{data.user.fullName}</h1>

        <Form method="get" onChange={event => submit(event.currentTarget)}>
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
                        defaultChecked={data.sort.includes(sort.value)}
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
          <noscript>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-purple-600 rounded"
            >
              Apply
            </button>
          </noscript>
        </Form>
      </aside>

      <main
        className={clsx('w-full min-h-screen', {
          'grid place-items-center text-center':
            data.user.sneakers.length === 0,
        })}
      >
        {data.user.sneakers.length === 0 ? (
          <div className="px-6">
            <h1 className="text-2xl font-medium">
              {data.user.fullName} has no sneakers in their collection
            </h1>
          </div>
        ) : (
          <ul className="grid grid-cols-2 px-4 py-6 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
            {data.user.sneakers.map(sneaker => (
              <SneakerCard
                key={sneaker.id}
                {...sneaker}
                showPurchasePrice={data.settings.showPurchasePrice}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
