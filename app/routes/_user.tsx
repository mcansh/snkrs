import * as React from "react";
import type {
  HeadersFunction,
  LoaderArgs,
  MetaFunction,
  SerializeFrom,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  useSubmit,
} from "@remix-run/react";
import type { Prisma } from "@prisma/client";
import uniqBy from "lodash.uniqby";
import { Dialog, Transition } from "@headlessui/react";
import { route } from "routes-gen";

import { prisma } from "~/db.server";
import { Svg } from "~/components/heroicons";
import { getUserId, sessionStorage } from "~/session.server";
import { getSeoMeta } from "~/seo";
import { possessive } from "~/utils/possessive";
import { formatMoney } from "~/utils/format-money";

export let loader = async ({ params, request }: LoaderArgs) => {
  let session = await sessionStorage.getSession(request.headers.get("Cookie"));
  let url = new URL(request.url);
  let userId = await getUserId(request);

  let selectedBrands = url.searchParams.getAll("brand");
  let sortQuery = url.searchParams.get("sort");
  let sort: Prisma.SortOrder = sortQuery === "asc" ? "asc" : "desc";

  let user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      username: true,
      id: true,
      fullName: true,
      settings: { select: { showTotalPrice: true } },
      sneakers: {
        include: { brand: true },
        orderBy: { purchaseDate: sort },
        where: {
          brand: {
            is: {
              OR:
                selectedBrands.length > 0
                  ? selectedBrands.map((brand) => ({
                      slug: brand,
                    }))
                  : undefined,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Response("This user doesn't exist", {
      status: 404,
      statusText: "Not Found",
    });
  }

  let sessionUser = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: {
          givenName: true,
          id: true,
        },
      })
    : null;

  let uniqueBrands = uniqBy(
    user.sneakers.map((sneaker) => sneaker.brand),
    "name"
  ).sort((a, b) => a.name.localeCompare(b.name));

  if (
    uniqueBrands.length > 0 &&
    uniqueBrands.every((brand) => selectedBrands.includes(brand.slug))
  ) {
    url.searchParams.delete("brand");
    throw redirect(url.toString());
  }

  let totalCollectionCost =
    user.settings?.showTotalPrice === true
      ? user.sneakers.reduce((acc, sneaker) => acc + sneaker.price, 0)
      : null;

  let { settings, sneakers, ...userToReturn } = user;

  return json(
    {
      user: {
        ...userToReturn,
        totalCollectionCost: totalCollectionCost
          ? formatMoney(totalCollectionCost)
          : null,
        collectionCount: sneakers.length,
      },
      filters: [
        {
          id: "brand",
          name: "Brand",
          options: uniqueBrands.map((brand) => {
            return {
              value: brand.slug,
              label: brand.name,
              checked: selectedBrands.includes(brand.slug),
            };
          }),
        },
      ],
      sort: sortQuery === "asc" ? "asc" : "desc",
      sessionUser,
    },
    {
      headers: {
        "Set-Cookie": sessionUser
          ? await sessionStorage.commitSession(session)
          : "",
      },
    }
  );
};

export let headers: HeadersFunction = ({ loaderHeaders }) => ({
  "Server-Timing": loaderHeaders.get("Server-Timing") ?? "",
});

const sortOptions = [
  { value: "desc", label: "Recent first" },
  { value: "asc", label: "Oldest first" },
];

export let meta: MetaFunction = ({
  data,
}: {
  data?: SerializeFrom<typeof loader> | undefined;
}) => {
  if (!data?.user) {
    return getSeoMeta();
  }

  let name = possessive(data.user.fullName);

  return getSeoMeta({
    title: `${name} Sneaker Collection`,
    description: `${name} sneaker collection`,
    twitter: {
      card: "summary_large_image",
      site: "@loganmcansh",
      // TODO: add support for linking your twitter account
      creator: "@loganmcansh",
      description: `${name} sneaker collection`,
      // TODO: add support for user avatar
    },
  });
};

export default function UserSneakersPage() {
  let data = useLoaderData<typeof loader>();
  let submit = useSubmit();
  let location = useLocation();
  let [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  if (
    data.sessionUser &&
    data.user.collectionCount === 0 &&
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
          to={route("/sneakers/add")}
        >
          Add a sneaker to your collection
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Transition.Root show={mobileFiltersOpen} as={React.Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 flex z-40 lg:hidden"
          onClose={setMobileFiltersOpen}
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
            <div className="ml-auto relative max-w-xs w-full h-full bg-white shadow-xl py-4 pb-6 flex flex-col overflow-y-auto">
              <div className="px-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                <button
                  type="button"
                  className="-mr-2 w-10 h-10 p-2 flex items-center justify-center fill-gray-400 hover:fill-gray-500"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <Svg className="h-6 w-6" name="24:solid:x-mark" />
                </button>
              </div>

              <Form
                key={location.key}
                action={location.pathname}
                className="mt-4"
                replace
                onChange={(event) => {
                  submit(event.currentTarget, { replace: true });
                }}
              >
                <div className="border-t border-gray-200 py-4">
                  <fieldset>
                    <legend className="w-full px-2">
                      <fieldset>
                        <legend className="w-full px-2">
                          <div className="w-full p-2 flex items-center justify-between text-gray-400 hover:text-gray-500">
                            <span className="text-sm font-medium text-gray-900">
                              Sort
                            </span>
                          </div>
                        </legend>
                        <div className="pt-4 pb-2 px-4">
                          <select
                            title="sort"
                            name="sort"
                            className="w-full border-gray-300 rounded text-indigo-600 focus:ring-indigo-500"
                            defaultValue={data.sort}
                          >
                            {sortOptions.map((option) => (
                              <option
                                key={`${option.label}-${option.value}`}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </fieldset>
                    </legend>
                  </fieldset>
                </div>
                {data.filters.map((section) => (
                  <div
                    key={section.name}
                    className="border-t border-gray-200 py-4"
                  >
                    <fieldset>
                      <legend className="w-full px-2">
                        <div className="w-full p-2 flex items-center justify-between text-gray-400 hover:text-gray-500">
                          <span className="text-sm font-medium text-gray-900">
                            {section.name}
                          </span>
                        </div>
                      </legend>
                      <div className="pt-4 pb-2 px-4">
                        <div className="space-y-6">
                          {section.options.map((option) => (
                            <div
                              key={option.value}
                              className="flex items-center"
                            >
                              <input
                                id={`${section.id}-${option.label}-mobile`}
                                name={section.id}
                                defaultChecked={option.checked}
                                value={option.value}
                                type="checkbox"
                                className="h-4 w-4 border-gray-300 rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <label
                                htmlFor={`${section.id}-${option.label}-mobile`}
                                className="ml-3 text-sm text-gray-500"
                              >
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </fieldset>
                  </div>
                ))}
              </Form>
            </div>
          </Transition.Child>
        </Dialog>
      </Transition.Root>

      <main className="max-w-2xl mx-auto pb-16 px-4 sm:pb-24 sm:px-6 lg:max-w-7xl lg:px-8 pt-10 sm:pt-16">
        <div className="border-b border-gray-200 pb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            {data.user.fullName}
          </h1>
          {data.user.totalCollectionCost ? (
            <h2>
              {" "}
              {data.sessionUser?.id === data.user.id ? "Your" : "This"}{" "}
              collection is worth {data.user.totalCollectionCost}
            </h2>
          ) : null}
        </div>

        <div className="pt-12 lg:grid lg:grid-cols-4 lg:gap-x-8">
          <aside>
            <h2 className="sr-only">Filters</h2>

            <button
              type="button"
              className="inline-flex items-center lg:hidden"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <span className="text-sm font-medium text-gray-700">Filters</span>
              <Svg
                className="flex-shrink-0 ml-1 h-5 w-5 fill-gray-700"
                name="20:solid:plus-small"
              />
            </button>

            <div className="hidden lg:block">
              <Form
                key={location.key}
                action={location.pathname}
                className="divide-y divide-gray-200 space-y-10"
                replace
                onChange={(event) => {
                  submit(event.currentTarget, { replace: true });
                }}
              >
                <div>
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-900">
                      Sort
                    </legend>
                    <div className="pt-6 space-y-3">
                      <select
                        title="sort"
                        name="sort"
                        className="border-gray-300 rounded text-indigo-600 focus:ring-indigo-500"
                      >
                        {sortOptions.map((option) => (
                          <option
                            key={`${option.label}-${option.value}`}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </fieldset>
                </div>
                {data.filters.map((section) => (
                  <div key={section.name} className="pt-10">
                    <fieldset>
                      <legend className="block text-sm font-medium text-gray-900">
                        {section.name}
                      </legend>
                      <div className="pt-6 space-y-3">
                        {section.options.map((option, optionIdx) => (
                          <div key={option.value} className="flex items-center">
                            <input
                              id={`${section.id}-${optionIdx}`}
                              name={section.id}
                              defaultChecked={option.checked}
                              value={option.value}
                              type="checkbox"
                              className="h-4 w-4 border-gray-300 rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <label
                              htmlFor={`${section.id}-${optionIdx}`}
                              className="ml-3 text-sm text-gray-600"
                            >
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                ))}
              </Form>
            </div>
          </aside>

          <div className="mt-6 lg:mt-0 lg:col-span-3">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
