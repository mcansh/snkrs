import * as React from 'react';
import type { Sneaker as SneakerType } from '@prisma/client';
import { Link } from '@remix-run/react';

import { getCloudinaryURL } from '../utils/cloudinary';
import { formatMoney } from '../utils/format-money';
import { formatDate } from '../utils/format-date';

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
    <li className="overflow-hidden transition-shadow duration-200 ease-linear bg-white rounded-lg shadow-md hover:shadow-lg">
      <Link to={`/sneakers/${id}`} className="flex flex-col h-full">
        <div className="relative flex items-center justify-center flex-grow">
          <img
            src={getCloudinaryURL(imagePublicId)}
            alt={alt}
            height={1200}
            width={1200}
            className="w-full h-full"
            loading="lazy"
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
      </Link>
    </li>
  );
};

export { Sneaker };
