import React from 'react';
import type { Sneaker as SneakerType } from '@prisma/client';
import Link from 'next/link';
import Image from 'next/image';

import { getCloudinaryURL } from 'src/utils/cloudinary';
import { formatMoney } from 'src/utils/format-money';
import { formatDate } from 'src/utils/format-date';

const Sneaker: React.FC<SneakerType> = ({
  id,
  model,
  colorway,
  brand,
  imagePublicId,
  price,
  purchaseDate,
  sold,
}) => {
  const alt = `${brand} ${model} – ${colorway}`;
  return (
    <li
      key={id}
      className="overflow-hidden transition-shadow duration-200 ease-linear bg-white rounded-lg shadow-md hover:shadow-lg"
    >
      <Link href="/sneakers/[id]" as={`/sneakers/${id}`}>
        <a className="flex flex-col h-full">
          <div className="relative flex items-center justify-center flex-grow">
            <Image
              src={getCloudinaryURL(imagePublicId)}
              alt={alt}
              height={640}
              width={640}
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
            <p>Purchased {formatDate(purchaseDate)}</p>
          </div>
        </a>
      </Link>
    </li>
  );
};

export { Sneaker };
