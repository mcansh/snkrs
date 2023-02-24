import { Prisma } from "@prisma/client";
import { Link } from "@remix-run/react";
import { route } from "routes-gen";
import type { SerializeFrom } from "@remix-run/node";

import { getCloudinaryURL, getImageURLs } from "~/utils/get-cloudinary-url";
import { formatMoney } from "~/utils/format-money";

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
    <div className="group relative">
      <div className="bg-gray-200 rounded-md overflow-hidden group-hover:opacity-75 aspect-1">
        <img
          src={getCloudinaryURL(imagePublicId, {
            resize: { width: 200, height: 200, type: "pad" },
          })}
          sizes="(min-width: 1024px) 25vw, 50vw"
          srcSet={srcSet}
          alt=""
        />
      </div>
      <h3 className="mt-4 text-sm text-gray-700">
        <Link to={route("/sneakers/:sneakerId", { sneakerId: id })}>
          <span className="absolute inset-0" />
          {brand.name} {model}
        </Link>
      </h3>
      <p className="mt-1 text-sm text-gray-500">{colorway}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">
        {formatMoney(price)}
      </p>
    </div>
  );
}
