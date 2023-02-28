import type { LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { route } from "routes-gen";

import { formatDate } from "~/utils/format-date";
import { getCloudinaryURL, getImageURLs } from "~/utils/get-cloudinary-url";
import { formatMoney } from "~/utils/format-money";
import { prisma } from "~/db.server";
import { getTimeZone, getUserId } from "~/session.server";
import { getPageTitle, mergeMeta } from "~/meta";

export let loader = async ({ params, request }: LoaderArgs) => {
  invariant(params.sneakerId, "sneakerID is required");

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

  if (!sneaker) {
    throw new Response(`Sneaker not found with id ${params.sneakerId}`, {
      status: 404,
      statusText: "Not Found",
    });
  }

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
    editing: false,
    sneaker,
    ogUrl: `${origin}/api/og/${sneaker.id}`,
  });
};

export let meta: V2_MetaFunction = mergeMeta<typeof loader>(({ data }) => {
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
    { property: "og:image", content: data.ogUrl },
    { property: "og:image:width", content: "800" },
    { property: "og:image:height", content: "400" },
    { property: "og:image:alt", content: data.title },
  ];
});

export default function SneakerPage() {
  let data = useLoaderData<typeof loader>();

  let srcSet = getImageURLs(data.sneaker.imagePublicId);

  return (
    <main className="container mx-auto h-full p-4 pb-6">
      <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 sm:gap-8">
        <div className="aspect-w-1 aspect-h-1 relative w-full overflow-hidden rounded-lg bg-gray-100">
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
              to={route("/:username/yir/:year", {
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
