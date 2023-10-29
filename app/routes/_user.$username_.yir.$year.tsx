import type { Prisma } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import type { MetaFunction } from "@remix-run/react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { endOfYear, startOfYear } from "date-fns";

import { SneakerCard } from "~/components/sneaker";
import { prisma } from "~/db.server";
import { getPageTitle, mergeMeta } from "~/meta";
import { invariantResponse } from "~/lib/http.server";

export let loader = async ({ params, request }: LoaderFunctionArgs) => {
  invariantResponse(params.year, 404);
  invariantResponse(params.username, 404);

  let url = new URL(request.url);
  let year = parseInt(params.year, 10);

  let date = new Date(year, 0);
  let start = startOfYear(date);
  let end = endOfYear(date);

  invariantResponse(
    year > new Date().getFullYear(),
    418,
    "Requested year is in the future",
  );

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
            slug: selectedBrands.length > 0 ? { in: selectedBrands } : {},
          },
        },
      },
    },
  });

  invariantResponse(user, 404, "User not found");

  return json({ user, year });
};

export let meta: MetaFunction = mergeMeta<typeof loader>(({ data }) => {
  if (!data) return [];
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
