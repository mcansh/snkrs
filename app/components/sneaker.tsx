import { Prisma } from "@prisma/client";
import { Link } from "@remix-run/react";
import { $path } from "remix-routes";
import type { SerializeFrom } from "@remix-run/node";

import { getCloudinaryURL, getImageURLs } from "~/lib/get-cloudinary-url";
import { formatMoney } from "~/lib/format-money";

let sneakerWithBrand = Prisma.validator<Prisma.SneakerArgs>()({
  include: { brand: true },
});

type SneakerWithBrand = SerializeFrom<
  Prisma.SneakerGetPayload<typeof sneakerWithBrand>
>;

export function SneakerCard({
  id,
  model,
  colorway,
  brand,
  imagePublicId,
  price,
}: SneakerWithBrand) {
  let srcSet = getImageURLs(imagePublicId);

  return (
    <li>
      <div className="group relative">
        <div className="aspect-1 overflow-hidden rounded-md bg-gray-200 group-hover:opacity-75">
          <img
            src={getCloudinaryURL(imagePublicId, {
              resize: { width: 200, height: 200, type: "pad" },
            })}
            sizes="(min-width: 1024px) 25vw, 50vw"
            srcSet={srcSet}
            alt=""
            height={1200}
            width={1200}
          />
        </div>
        <h3 className="mt-4 text-sm text-gray-700">
          <Link
            to={$path("/sneakers/:sneakerId", { sneakerId: id })}
            prefetch="viewport"
            data-component="SneakerCard"
          >
            <span className="absolute inset-0" />
            {brand.name} {model}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-gray-500">{colorway}</p>
        <p className="mt-1 text-sm font-medium text-gray-900">
          {formatMoney(price)}
        </p>
      </div>
    </li>
  );
}
