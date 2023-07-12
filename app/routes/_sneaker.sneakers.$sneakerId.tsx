import type { LoaderArgs } from "@remix-run/node";
import type { V2_MetaFunction } from "@remix-run/react";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { $path } from "remix-routes";

import { copy } from "~/lib/copy";
import { prisma } from "~/db.server";
import { getTimeZone, getUserId } from "~/session.server";
import { getPageTitle, mergeMeta } from "~/meta";
import { formatDate } from "~/lib/format-date";
import { invariantResponse } from "~/lib/http.server";

export let loader = async ({ params, request }: LoaderArgs) => {
  invariantResponse(params.sneakerId, 404);

  let userId = await getUserId(request);

  let sneaker = await prisma.sneaker.findUnique({
    where: { id: params.sneakerId },
    include: {
      brand: true,
      user: {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      },
    },
  });

  invariantResponse(sneaker, 404, "Sneaker not found");

  let userCreatedSneaker = sneaker.user.id === userId;

  let settings = await prisma.settings.findUnique({
    where: { userId: sneaker.user.id },
  });

  return json({
    id: params.sneakerId,
    timeZone: await getTimeZone(request),
    userCreatedSneaker,
    title: `${sneaker.brand.name} ${sneaker.model} – ${sneaker.colorway}`,
    purchaseYear: new Date(sneaker.purchaseDate).getFullYear(),
    settings: {
      showPurchasePrice: settings?.showPurchasePrice ?? true,
      showRetailPrice: settings?.showRetailPrice ?? false,
    },
    sneaker,
  });
};

export let meta: V2_MetaFunction = mergeMeta<typeof loader>(({ data }) => {
  if (!data) return [];
  let date = formatDate(data.sneaker.purchaseDate, data.timeZone, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return [
    { title: getPageTitle(data.title) },
    {
      name: "description",
      content: `${data.sneaker.user.fullName} bought the ${data.sneaker.brand.name} ${data.sneaker.model} on ${date}`,
    },
  ];
});

export default function SneakerPage() {
  let data = useLoaderData<typeof loader>();

  return (
    <div className="flex justify-between">
      <button
        type="button"
        className="text-blue-600 transition-colors duration-75 ease-in-out hover:text-blue-900 hover:underline"
        onClick={() => {
          if ("share" in navigator) {
            let date = formatDate(data.sneaker.purchaseDate, data.timeZone, {
              month: "long",
              day: "numeric",
              year: "numeric",
            });

            return navigator.share({
              title: data.title,
              text: `${data.sneaker.user.fullName} bought the ${data.sneaker.brand.name} ${data.sneaker.model} on ${date}`,
              url: location.href,
            });
          }

          return copy(location.href);
        }}
      >
        Permalink
      </button>
      {data.userCreatedSneaker && (
        <Link
          to={$path("/sneakers/:sneakerId/edit", {
            sneakerId: data.sneaker.id,
          })}
          prefetch="intent"
          className="inline-block text-blue-600 transition-colors duration-75 ease-in-out hover:text-blue-900 hover:underline"
        >
          Edit Sneaker
        </Link>
      )}
    </div>
  );
}
