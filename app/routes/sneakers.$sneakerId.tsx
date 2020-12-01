import React from 'react';
import type { Sneaker as SneakerType, User } from '@prisma/client';
import { Link, useRouteData } from '@remix-run/react';

import { formatDate } from '../utils/format-date';
import { getCloudinaryURL } from '../utils/cloudinary';
import { formatMoney } from '../utils/format-money';
import { copy } from '../utils/copy';

type SneakerWithUser = SneakerType & {
  User: Pick<User, 'name' | 'id' | 'username'>;
};

interface Props {
  sneaker: SneakerWithUser;
  id: string;
  userCreatedSneaker: boolean;
}

const meta = ({ data: { sneaker } }: { data: Props }) => {
  const date = formatDate(sneaker.purchaseDate, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const description = `${sneaker.User.name} bought the ${sneaker.brand} ${sneaker.model} on ${date}`;

  return {
    title: `${sneaker.brand} ${sneaker.model} – ${sneaker.colorway}`,
    description,
  };
};

const SneakerPage: React.VFC = () => {
  const { sneaker, id, userCreatedSneaker } = useRouteData<Props>();

  if (!sneaker) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        <p>No sneaker with id &quot;{id}&quot;</p>
      </div>
    );
  }

  const title = `${sneaker.brand} ${sneaker.model} – ${sneaker.colorway}`;
  const year = new Date(sneaker.purchaseDate).getFullYear();

  const belowRetail = sneaker.retailPrice > sneaker.price;
  const atRetail = sneaker.retailPrice === sneaker.price;

  const image1x = getCloudinaryURL(sneaker.imagePublicId, {
    width: 400,
    crop: 'pad',
  });
  const image2x = getCloudinaryURL(sneaker.imagePublicId, {
    width: 800,
    crop: 'pad',
  });
  const image3x = getCloudinaryURL(sneaker.imagePublicId, {
    width: 1200,
    crop: 'pad',
  });

  return (
    <main className="container min-h-full p-4 mx-auto">
      <Link to="/">Back</Link>
      <div className="grid grid-cols-1 gap-4 pt-4 sm:gap-8 sm:grid-cols-2">
        <div
          className="relative"
          style={{
            paddingBottom: '100%',
          }}
        >
          <img
            src={image2x}
            srcSet={`${image1x} 1x, ${image2x} 2x, ${image3x} 3x`}
            alt={title}
            height={1200}
            width={1200}
            className="absolute inset-0 overflow-hidden rounded-md"
            loading="lazy"
          />
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl">{title}</h1>

          {atRetail ? (
            <p className="text-xl">{formatMoney(sneaker.price)}</p>
          ) : (
            <p className="text-xl">
              Bought {belowRetail ? 'below' : 'above'} retail (
              {formatMoney(sneaker.retailPrice)}) {belowRetail ? '🔥' : '😭'}{' '}
              for {formatMoney(sneaker.price)}
            </p>
          )}

          <p className="text-md">
            Purchased on{' '}
            <time dateTime={new Date(sneaker.purchaseDate).toISOString()}>
              {formatDate(sneaker.purchaseDate)}
            </time>
          </p>

          {sneaker.sold && sneaker.soldDate && (
            <p className="text-md">
              Sold{' '}
              <time dateTime={sneaker.soldDate.toISOString()}>
                {formatDate(sneaker.soldDate)}{' '}
                {sneaker.soldPrice && <>For {formatMoney(sneaker.soldPrice)}</>}
              </time>
            </p>
          )}

          <Link
            to={`/${sneaker.User.username}/yir/${year}`}
            className="block text-blue-600 transition-colors duration-75 ease-in-out hover:text-blue-900 hover:underline"
          >
            See others purchased in {year}
          </Link>

          <div className="flex justify-between mt-auto">
            {userCreatedSneaker && (
              <Link
                to={`/sneakers/${sneaker.id}/edit`}
                className="text-blue-600 transition-colors duration-75 ease-in-out hover:text-blue-900 hover:underline"
              >
                Edit Sneaker
              </Link>
            )}
            <button
              type="button"
              className="text-blue-600 transition-colors duration-75 ease-in-out hover:text-blue-900 hover:underline"
              onClick={() => {
                if (navigator.share) {
                  const date = formatDate(sneaker.purchaseDate, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return navigator.share({
                    title: `${sneaker.brand} ${sneaker.model} – ${sneaker.colorway}`,
                    text: `${sneaker.User.name} bought the ${sneaker.brand} ${sneaker.model} on ${date}`,
                    url: location.href,
                  });
                }

                return copy(location.href);
              }}
            >
              Permalink
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SneakerPage;
export { meta };
