import type { LoaderFunctionArgs, SerializeFrom } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { Prisma } from "@prisma/client";

import { prisma } from "~/db.server";
import { SneakerCard } from "~/components/sneaker";
import { getUserId, sessionStorage } from "~/session.server";
import { invariantResponse } from "~/lib/http.server";

export let loader = async ({ params, request }: LoaderFunctionArgs) => {
  let session = await sessionStorage.getSession(request.headers.get("Cookie"));
  let url = new URL(request.url);
  let userId = await getUserId(request);

  invariantResponse(params.username, 404);

  let selectedBrands = url.searchParams.getAll("brand");
  let sortQuery = url.searchParams.get("sort");
  let sort: Prisma.SortOrder = sortQuery === "asc" ? "asc" : "desc";

  let user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      fullName: true,
      sneakers: {
        include: { brand: true },
        orderBy: { purchaseDate: sort },
        where: {
          brand: {
            slug: selectedBrands.length > 0 ? { in: selectedBrands } : {},
          },
        },
      },
    },
  });

  invariantResponse(user, 404, "User not found");

  let sessionUser = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: {
          givenName: true,
          id: true,
        },
      })
    : null;

  return json(
    { user },
    {
      headers: {
        "Set-Cookie": sessionUser
          ? await sessionStorage.commitSession(session)
          : "",
      },
    },
  );
};

export default function UserSneakersPage() {
  let data = useLoaderData<typeof loader>();

  return (
    <div className="mt-6 lg:col-span-2 lg:mt-0 xl:col-span-3">
      {data.user.sneakers.length === 0 ? (
        <EmptyState fullName={data.user.fullName} />
      ) : (
        <SneakerGrid sneakers={data.user.sneakers} />
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

function SneakerGrid({
  sneakers,
}: {
  sneakers: SerializeFrom<typeof loader>["user"]["sneakers"];
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
      {sneakers.map((sneaker) => (
        <SneakerCard key={sneaker.id} {...sneaker} />
      ))}
    </ul>
  );
}
