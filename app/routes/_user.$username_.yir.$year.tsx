import type { Prisma } from "@prisma/client";
import type { LoaderArgs } from "@remix-run/node";
import type { V2_MetaFunction } from "@remix-run/react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { endOfYear, startOfYear } from "date-fns";
import invariant from "tiny-invariant";

import { SneakerCard } from "~/components/sneaker";
import { prisma } from "~/db.server";
import { getPageTitle, mergeMeta } from "~/meta";

export let loader = async ({ params, request }: LoaderArgs) => {
  invariant(params.year, "year is required");
  invariant(params.username, "username is required");
  let url = new URL(request.url);
  let year = parseInt(params.year, 10);

  let date = new Date(year, 0);
  let start = startOfYear(date);
  let end = endOfYear(date);

  if (year > new Date().getFullYear()) {
    throw new Response("Requested year is in the future", {
      status: 404,
      statusText: "Not Found",
    });
  }

  let selectedBrands = url.searchParams.getAll("brand");
  let sortQuery = url.searchParams.get("sort");
  let sort: Prisma.SortOrder = sortQuery === "asc" ? "asc" : "desc";

  let user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      username: true,
      settings: true,
      sneakers: {
        orderBy: { purchaseDate: sort },
        include: { brand: true },
        where: {
          purchaseDate: {
            gte: start,
            lte: end,
          },
          brand: {
            is: {
              OR:
                selectedBrands.length > 0
                  ? selectedBrands.map((brand) => ({ slug: brand }))
                  : undefined,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Response("User not found", {
      status: 404,
      statusText: "Not Found",
    });
  }

  return json({ user, year });
};

export let meta: V2_MetaFunction = mergeMeta<typeof loader>(({ data }) => {
  let sneakers = data.user.sneakers.length === 1 ? "sneaker" : "sneakers";
  let description = `${data.user.username} bought ${data.user.sneakers.length} ${sneakers} in ${data.year}`;
  return [
    { title: getPageTitle(`${data.year} • ${data.user.username}`) },
    { name: "description", content: description },
    { property: "og:description", content: description },
  ];
});

export default function SneakersYearInReview() {
  let { user, year } = useLoaderData<typeof loader>();

  if (!user.sneakers.length) {
    return (
      <div className="flex h-full w-full items-center justify-center text-center text-lg">
        <p>
          {user.username} didn&apos;t buy any sneakers in {year}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 lg:col-span-2 lg:mt-0 xl:col-span-3">
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
        {user.sneakers.map((sneaker) => (
          <SneakerCard key={sneaker.id} {...sneaker} />
        ))}
      </ul>
    </div>
  );
}
