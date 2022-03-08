import React from 'react';
import { Prisma } from '@prisma/client';
import { json, Link, useLoaderData } from 'remix';
import type { Except } from 'type-fest';
import type { LoaderFunction, MetaFunction } from 'remix';
import invariant from 'tiny-invariant';
import { route } from 'routes-gen';

import { formatDate } from '~/utils/format-date';
import { getCloudinaryURL } from '~/utils/get-cloudinary-url';
import { formatMoney } from '~/utils/format-money';
import { copy } from '~/utils/copy';
import { prisma } from '~/db.server';
import { getSeoMeta } from '~/seo';
import { getUserId } from '~/session.server';

let sneakerWithUser = Prisma.validator<Prisma.SneakerArgs>()({
  include: {
    brand: true,
    user: {
      select: {
        id: true,
        fullName: true,
        username: true,
      },
    },
  },
});

type SneakerWithUser = Except<
  Prisma.SneakerGetPayload<typeof sneakerWithUser>,
  'createdAt' | 'purchaseDate' | 'soldDate' | 'updatedAt'
> & {
  soldDate: string | undefined;
  purchaseDate: string;
  updatedAt: string;
  createdAt: string;
};

interface RouteData {
  sneaker: SneakerWithUser;
  id: string;
  userCreatedSneaker: boolean;
  purchaseYear: number;
  title: string;
  settings: {
    showPurchasePrice: boolean;
    showRetailPrice: boolean;
  };
}

let loader: LoaderFunction = async ({ params, request }) => {
  invariant(params.sneakerId, 'sneakerID is required');

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
    });
  }

  let userCreatedSneaker = sneaker.user.id === userId;

  let settings = await prisma.settings.findUnique({
    where: { userId: sneaker.user.id },
  });

  return json<RouteData>({
    id: params.sneakerId,
    userCreatedSneaker,
    title: `${sneaker.brand.name} ${sneaker.model} – ${sneaker.colorway}`,
    purchaseYear: new Date(sneaker.purchaseDate).getFullYear(),
    settings: {
      showPurchasePrice: settings?.showPurchasePrice ?? true,
      showRetailPrice: settings?.showRetailPrice ?? false,
    },
    sneaker: {
      ...sneaker,
      createdAt:
        typeof sneaker.createdAt === 'string'
          ? sneaker.createdAt
          : sneaker.createdAt.toISOString(),
      soldDate:
        typeof sneaker.soldDate === 'string'
          ? sneaker.soldDate
          : sneaker.soldDate?.toISOString(),
      purchaseDate:
        typeof sneaker.purchaseDate === 'string'
          ? sneaker.purchaseDate
          : sneaker.purchaseDate.toISOString(),
      updatedAt:
        typeof sneaker.updatedAt === 'string'
          ? sneaker.updatedAt
          : sneaker.updatedAt.toISOString(),
    },
  });
};

let meta: MetaFunction = ({ data }: { data: RouteData | null }) => {
  if (!data) {
    return getSeoMeta({
      title: 'Sneaker Not Found',
    });
  }

  let date = formatDate(data.sneaker.purchaseDate, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return getSeoMeta({
    title: data.title,
    description: `${data.sneaker.user.fullName} bought the ${data.sneaker.brand.name} ${data.sneaker.model} on ${date}`,
  });
};

let SneakerPage: React.VFC = () => {
  let data = useLoaderData<RouteData>();

  let sizes = [200, 400, 600];

  let srcSet = sizes.map(
    size =>
      `${getCloudinaryURL(data.sneaker.imagePublicId, {
        resize: {
          width: size,
          height: size,
          type: 'pad',
        },
      })} ${size}w`
  );

  return (
    <main className="container h-full p-4 pb-6 mx-auto">
      <Link
        prefetch="intent"
        to={route('/:username', { username: data.sneaker.user.username })}
      >
        Back
      </Link>
      <div className="grid grid-cols-1 gap-4 pt-4 sm:gap-8 sm:grid-cols-2">
        <div className="relative w-full overflow-hidden bg-gray-100 rounded-lg aspect-w-1 aspect-h-1">
          <img
            src={getCloudinaryURL(data.sneaker.imagePublicId, {
              resize: {
                type: 'pad',
                width: 200,
                height: 200,
              },
            })}
            sizes="(min-width: 640px) 50vw, 100vw"
            srcSet={srcSet.join()}
            alt={data.title}
            className="object-contain"
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
              Purchased on{' '}
              <time dateTime={data.sneaker.purchaseDate}>
                {formatDate(data.sneaker.purchaseDate)}
              </time>
            </p>

            <p>
              Last Updated{' '}
              <time dateTime={data.sneaker.updatedAt}>
                {formatDate(data.sneaker.updatedAt)}
              </time>
            </p>

            {data.sneaker.sold && data.sneaker.soldDate && (
              <p className="text-md">
                Sold{' '}
                <time dateTime={data.sneaker.soldDate}>
                  {formatDate(data.sneaker.soldDate)}{' '}
                  {data.sneaker.soldPrice && (
                    <>For {formatMoney(data.sneaker.soldPrice)}</>
                  )}
                </time>
              </p>
            )}

            <Link
              to={route('/:username/yir/:year', {
                username: data.sneaker.user.username,
                year: data.purchaseYear.toString(),
              })}
              className="block text-blue-600 transition-colors duration-75 ease-in-out hover:text-blue-900 hover:underline"
              prefetch="intent"
            >
              See others purchased in {data.purchaseYear}
            </Link>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              className="text-blue-600 transition-colors duration-75 ease-in-out hover:text-blue-900 hover:underline"
              onClick={() => {
                if ('share' in navigator) {
                  let date = formatDate(data.sneaker.purchaseDate, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
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
                to={route('/sneakers/:sneakerId/edit', {
                  sneakerId: data.sneaker.id,
                })}
                className="inline-block text-blue-600 transition-colors duration-75 ease-in-out hover:text-blue-900 hover:underline"
              >
                Edit Sneaker
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default SneakerPage;
export { meta, loader };
