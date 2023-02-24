import * as React from "react";
import type { LoaderArgs, MetaFunction, SerializeFrom } from "@remix-run/node";
import { defer } from "@remix-run/node";
import { Await, useLoaderData } from "@remix-run/react";
import type { Brand, Prisma, Sneaker } from "@prisma/client";

import { prisma } from "~/db.server";
import { SneakerCard } from "~/components/sneaker";
import { getUserId, sessionStorage } from "~/session.server";
import { getSeoMeta } from "~/seo";
import { possessive } from "~/utils/possessive";

export let loader = async ({ params, request }: LoaderArgs) => {
  let session = await sessionStorage.getSession(request.headers.get("Cookie"));
  let url = new URL(request.url);
  let userId = await getUserId(request);

  let selectedBrands = url.searchParams.getAll("brand");
  let sortQuery = url.searchParams.get("sort");
  let sort: Prisma.SortOrder = sortQuery === "asc" ? "asc" : "desc";

  let initial_sneakers_to_fetch = 20;

  let user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      fullName: true,
      sneakers: {
        include: { brand: true },
        orderBy: { purchaseDate: sort },
        take: initial_sneakers_to_fetch,
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

  let rest = new Promise<(Sneaker & { brand: Brand })[]>(async (resolve) => {
    let r = await prisma.sneaker.findMany({
      where: {
        user: { username: params.username },
      },
      skip: initial_sneakers_to_fetch,
      include: { brand: true },
      orderBy: { purchaseDate: sort },
    });

    resolve(r);
  });

  return defer(
    { user, rest },
    {
      headers: {
        "Set-Cookie": sessionUser
          ? await sessionStorage.commitSession(session)
          : "",
      },
    }
  );
};

export let meta: MetaFunction = ({
  data,
}: {
  data?: Partial<SerializeFrom<typeof loader>>;
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

  return (
    <div className="mt-6 lg:mt-0 lg:col-span-2 xl:col-span-3">
      {data.user.sneakers.length === 0 ? (
        <EmptyState fullName={data.user.fullName} />
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {data.user.sneakers.map((sneaker) => {
            return (
              <li key={sneaker.id}>
                <SneakerCard key={sneaker.id} {...sneaker} />
              </li>
            );
          })}
          <React.Suspense
            fallback={
              <>
                <li>
                  <FallbackSneakerCard />
                </li>
                <li>
                  <FallbackSneakerCard />
                </li>
                <li>
                  <FallbackSneakerCard />
                </li>
                <li>
                  <FallbackSneakerCard />
                </li>
              </>
            }
          >
            <Await resolve={data.rest} errorElement={<p>oops...</p>}>
              {(resolved) => {
                return resolved.map((sneaker) => {
                  return (
                    <li key={sneaker.id}>
                      <SneakerCard key={sneaker.id} {...sneaker} />
                    </li>
                  );
                });
              }}
            </Await>
          </React.Suspense>
        </ul>
      )}
    </div>
  );
}

function EmptyState({ fullName }: { fullName: string }) {
  return (
    <div className="px-6">
      <h1 className="text-2xl font-medium">
        {fullName} has no sneakers in their collection
      </h1>
    </div>
  );
}

function FallbackSneakerCard() {
  return (
    <div className="animate-pulse flex">
      <div className="flex-1">
        <div className="bg-gray-400 rounded-md overflow-hidden group-hover:opacity-75 aspect-1" />
        <div className="rounded-md mt-1 text-sm bg-gray-400 text-transparent">
          ...
        </div>
        <div className="rounded-md mt-1 text-sm font-medium text-transparent bg-gray-400">
          ...
        </div>
      </div>
    </div>
  );
}
