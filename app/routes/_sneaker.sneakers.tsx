import type { LoaderArgs } from "@remix-run/node";
import type { V2_MetaFunction } from "@remix-run/react";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { $path } from "remix-routes";

import { formatDate } from "~/lib/format-date";
import { getCloudinaryURL, getImageURLs } from "~/lib/get-cloudinary-url";
import { formatMoney } from "~/lib/format-money";
import { prisma } from "~/db.server";
import { getUserId } from "~/session.server";
import { getPageTitle, mergeMeta } from "~/meta";
import { invariantResponse } from "~/lib/http.server";
import { getHints } from "~/lib/client-hints";

export let loader = async ({ params, request }: LoaderArgs) => {
  invariantResponse(params.sneakerId, 404);

  let userId = await getUserId(request);
  let url = new URL(request.url);
  let origin = url.origin;

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

  let { timeZone } = getHints(request);

  return json({
    id: params.sneakerId,
    timeZone,
    userCreatedSneaker,
    title: `${sneaker.brand.name} ${sneaker.model} – ${sneaker.colorway}`,
    purchaseYear: new Date(sneaker.purchaseDate).getFullYear(),
    settings: {
      showPurchasePrice: settings?.showPurchasePrice ?? true,
      showRetailPrice: settings?.showRetailPrice ?? false,
    },
    editing: false,
    sneaker,
    ogUrl: `${origin}/api/og/${sneaker.id}`,
  });
};

export let meta: V2_MetaFunction = mergeMeta<typeof loader>(
  ({ data }) => {
    if (!data) return [];
    let date = formatDate(data.sneaker.purchaseDate, data.timeZone, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    let description = `${data.sneaker.user.fullName} bought the ${data.sneaker.brand.name} ${data.sneaker.model} on ${date}`;

    return [
      { title: getPageTitle(data.title) },
      {
        name: "description",
        content: description,
      },
      { property: "og:title", content: data.title },
      { property: "og:description", content: description },
      { property: "og:image", content: data.ogUrl },
      { property: "og:image:width", content: "800" },
      { property: "og:image:height", content: "400" },
      { property: "og:image:alt", content: data.title },
    ];
  },
  ({ data }) => {
    if (!data) return [];
    let date = formatDate(data.sneaker.purchaseDate, data.timeZone, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    let description = `${data.sneaker.user.fullName} bought the ${data.sneaker.brand.name} ${data.sneaker.model} on ${date}`;
    return [
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: description },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: data.ogUrl },
      { name: "twitter:image:alt", content: data.title },
    ];
  },
);

export default function SneakerPage() {
  let data = useLoaderData<typeof loader>();

  let srcSet = getImageURLs(data.sneaker.imagePublicId);

  return (
    <main className="container mx-auto h-full p-4 pb-6">
      <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 sm:gap-8">
        <div className="aspect-h-1 aspect-w-1 relative w-full overflow-hidden rounded-lg bg-gray-100">
          <img
            src={getCloudinaryURL(data.sneaker.imagePublicId, {
              resize: { type: "pad", width: 200, height: 200 },
            })}
            sizes="(min-width: 640px) 50vw, 100vw"
            srcSet={srcSet}
            alt={data.title}
            height={480}
            width={480}
          />
        </div>
        <div className="flex flex-col justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl">{data.title}</h1>

            {data.settings.showPurchasePrice && (
              <p>Purchase Price {formatMoney(data.sneaker.price)}</p>
            )}

            {data.settings.showRetailPrice && (
              <p>Retail Price {formatMoney(data.sneaker.retailPrice)}</p>
            )}

            <p className="text-md">
              Purchased on{" "}
              <time dateTime={data.sneaker.purchaseDate}>
                {formatDate(data.sneaker.purchaseDate, data.timeZone)}
              </time>
            </p>

            <p>
              Last Updated{" "}
              <time dateTime={data.sneaker.updatedAt}>
                {formatDate(data.sneaker.updatedAt, data.timeZone)}
              </time>
            </p>

            {data.sneaker.sold && data.sneaker.soldDate && (
              <p className="text-md">
                Sold{" "}
                <time dateTime={data.sneaker.soldDate}>
                  {formatDate(data.sneaker.soldDate, data.timeZone)}{" "}
                  {data.sneaker.soldPrice && (
                    <>For {formatMoney(data.sneaker.soldPrice)}</>
                  )}
                </time>
              </p>
            )}
            <Link
              to={$path("/:username/yir/:year", {
                username: data.sneaker.user.username,
                year: data.purchaseYear.toString(),
              })}
              className="block text-blue-600 transition-colors duration-75 ease-in-out hover:text-blue-900 hover:underline"
              prefetch="intent"
            >
              See others purchased in {data.purchaseYear}
            </Link>
          </div>

          <Outlet />
        </div>
      </div>
    </main>
  );
}
