import * as React from 'react';
import { Prisma } from '@prisma/client';
import { Link } from 'remix';
import { route } from 'routes-gen';

import { getCloudinaryURL } from '~/utils/get-cloudinary-url';
import { formatMoney } from '~/utils/format-money';
import { formatDate } from '~/utils/format-date';

let sneakerWithBrand = Prisma.validator<Prisma.SneakerArgs>()({
  include: { brand: true },
});

type SneakerWithBrand = Prisma.SneakerGetPayload<typeof sneakerWithBrand>;

interface Props extends SneakerWithBrand {
  showPurchasePrice: boolean;
}

let SneakerCard: React.VFC<Props> = ({
  id,
  model,
  colorway,
  brand,
  imagePublicId,
  price,
  purchaseDate,
  sold,
  showPurchasePrice,
}) => {
  let sizes = [200, 400, 600];

  let images = sizes.map(size =>
    getCloudinaryURL(imagePublicId, {
      resize: {
        type: 'pad',
        width: size,
        height: size,
      },
    })
  );

  let srcSet = images
    .map((image, index) => `${image} ${sizes[index]}w`)
    .join(', ');

  return (
    <li>
      <div className="relative block w-full overflow-hidden bg-gray-100 rounded-lg group aspect-w-1 aspect-h-1 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-100 focus-within:ring-blue-500">
        <img
          src={images[0]}
          sizes="(min-width: 1024px) 25vw, 50vw"
          srcSet={srcSet}
          alt=""
          className="object-contain pointer-events-none group-hover:opacity-75"
        />
        {sold && (
          <span className="absolute flex items-center justify-center text-2xl text-white bg-black text-opacity-60 bg-opacity-40">
            Sold!
          </span>
        )}
        <Link
          to={route('/sneakers/:sneakerId', { sneakerId: id })}
          className="absolute inset-0 focus:outline-none"
          prefetch="intent"
        >
          <span className="sr-only">
            View details for {brand.name} {model}
          </span>
        </Link>
      </div>
      <div className="text-sm font-medium pointer-events-none">
        <p className="mt-2 text-gray-900 truncate">
          {brand.name} {model}
        </p>
        <p className="text-gray-500 truncate">{colorway}</p>
        {showPurchasePrice && (
          <p className="text-gray-500 truncate">{formatMoney(price)}</p>
        )}
        <p className="text-gray-500 truncate">
          Purchased {formatDate(purchaseDate)}
        </p>
      </div>
    </li>
  );
};

export { SneakerCard };
