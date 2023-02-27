import type { LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { route } from "routes-gen";

import { formatDate } from "~/utils/format-date";
import { getCloudinaryURL, getImageURLs } from "~/utils/get-cloudinary-url";
import { formatMoney } from "~/utils/format-money";
import { copy } from "~/utils/copy";
import { prisma } from "~/db.server";
import { getTimeZone, getUserId } from "~/session.server";
import { getPageTitle, mergeMeta } from "~/meta";

export let loader = async ({ params, request }: LoaderArgs) => {
  invariant(params.sneakerId, "sneakerID is required");

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
    sneaker,
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
          to={route("/sneakers/:sneakerId/edit", {
            sneakerId: data.sneaker.id,
          })}
          className="inline-block text-blue-600 transition-colors duration-75 ease-in-out hover:text-blue-900 hover:underline"
        >
          Edit Sneaker
        </Link>
      )}
    </div>
  );
}
