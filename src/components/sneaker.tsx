import React from 'react';
import { Sneaker as SneakerType } from '@prisma/client';
import Link from 'next/link';
import { SimpleImg } from 'react-simple-img';

import { getCloudinaryURL } from 'src/utils/cloudinary';
import { formatMoney } from 'src/utils/format-money';
import { formatDate } from 'src/utils/format-date';

export interface SneakerISODate
  extends Omit<SneakerType, 'purchaseDate' | 'soldDate'> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  purchaseDate: string | null;
  // eslint-disable-next-line @typescript-eslint/ban-types
  soldDate: string | null;
}

const Sneaker: React.FC<SneakerISODate> = ({
  id,
  model,
  colorway,
  brand,
  imagePublicId,
  price,
  purchaseDate,
  sold,
}) => (
  <li
    key={id}
    className="overflow-hidden transition-shadow duration-200 ease-linear bg-white rounded-lg shadow-md hover:shadow-lg"
  >
    <Link href="/sneakers/[id]" as={`/sneakers/${id}`}>
      <a className="flex flex-col block h-full ">
        <div className="relative flex items-center justify-center flex-grow">
          <SimpleImg
            src={getCloudinaryURL(imagePublicId)}
            alt={`${model} by ${brand} in the ${colorway} colorway`}
            height={200}
            width={200}
            applyAspectRatio
            className="w-full h-full"
          />
          {sold && (
            <div className="absolute w-full p-1 text-xl font-bold text-center text-white transform -translate-x-1/2 -translate-y-1/2 bg-red-400 bg-opacity-75 top-1/2 left-1/2">
              Sold!
            </div>
          )}
        </div>
        <div className="px-4 py-2">
          <h2 className="text-xl truncate">
            {brand} {model}
          </h2>
          <p className="text-lg truncate">{colorway}</p>
          {price && <p>{formatMoney(price)}</p>}
          {purchaseDate && <p>Purchased {formatDate(purchaseDate)}</p>}
        </div>
      </a>
    </Link>
  </li>
);

export { Sneaker };
