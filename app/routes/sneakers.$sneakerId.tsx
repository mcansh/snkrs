import React from 'react';
import type { Brand, Sneaker as SneakerType, User } from '@prisma/client';
import type { HeadersFunction } from '@remix-run/react';
import { Link, useRouteData } from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import slugify from 'slugify';

import { formatDate } from '../utils/format-date';
import { getCloudinaryURL } from '../utils/cloudinary';
import { formatMoney } from '../utils/format-money';
import { copy } from '../utils/copy';
import { flashMessageKey, redirectKey, sessionKey } from '../constants';
import { prisma } from '../db';
import { AuthorizationError } from '../errors';
import { flashMessage } from '../flash-message';
import { purgeCloudflareCache } from '../lib/cloudflare-cache-purge';
import { withSession } from '../lib/with-session';
import { updateSneakerSchema } from '../lib/schemas/sneaker';

type SneakerWithUser = SneakerType & {
  brand: Brand;
  soldDate: string;
  purchaseDate: string;
  updatedAt: string;
  user: Pick<User, 'givenName' | 'familyName' | 'id' | 'username'>;
};

interface RouteData {
  sneaker: SneakerWithUser;
  id: string;
  userCreatedSneaker: boolean;
}

const headers: HeadersFunction = ({ loaderHeaders }) => ({
  'Cache-Control': loaderHeaders.get('Cache-Control') ?? 'no-cache',
});

const loader: LoaderFunction = ({ params, request }) =>
  withSession(request, async session => {
    const sneaker = await prisma.sneaker.findUnique({
      where: { id: params.sneakerId },
      include: {
        brand: true,
        user: {
          select: {
            givenName: true,
            familyName: true,
            id: true,
            username: true,
          },
        },
      },
    });

    if (!sneaker) {
      return json({ id: params.sneakerId }, { status: 404 });
    }

    const userCreatedSneaker = sneaker?.user.id === session.get(sessionKey);

    return json(
      {
        sneaker,
        id: params.sneakerId,
        userCreatedSneaker,
      },
      {
        headers: {
          'Cache-Control': `max-age=300, s-maxage=31536000, stale-while-revalidate=31536000`,
        },
      }
    );
  });

const action: ActionFunction = ({ request, params }) =>
  withSession(request, async session => {
    const userId = session.get(sessionKey);
    const { sneakerId } = params;
    const { pathname } = new URL(request.url);

    try {
      const reqBody = await request.text();
      const body = new URLSearchParams(reqBody);

      if (!userId) {
        throw new AuthorizationError();
      }

      const valid = await updateSneakerSchema.validate({
        brand: body.get('brand'),
        colorway: body.get('colorway'),
        imagePublicId: body.get('image'),
        model: body.get('model'),
        price: body.get('price'),
        purchaseDate: body.get('purchaseDate'),
        retailPrice: body.get('retailPrice'),
        size: body.get('size'),
        sold: body.get('sold'),
        soldDate: body.get('soldDate'),
        soldPrice: body.get('soldPrice'),
      });

      const updatedSneaker = await prisma.sneaker.update({
        where: { id: sneakerId },
        data: {
          brand: {
            connectOrCreate: {
              create: {
                name: valid.brand,
                slug: slugify(valid.brand, { lower: true }),
              },
              where: {
                name: valid.name,
              },
            },
          },
          colorway: valid.colorway,
          imagePublicId: valid.imagePublicId,
          model: valid.model,
          price: valid.price,
          purchaseDate: valid.purchaseDate,
          retailPrice: valid.retail,
          size: valid.size,
          sold: valid.sold,
          soldDate: valid.soldDate,
          soldPrice: valid.soldPrice,
        },
        select: {
          user: { select: { username: true } },
          brand: true,
          purchaseDate: true,
        },
      });

      const prefix = `https://snkrs.mcan.sh/${updatedSneaker.user.username}`;
      await purgeCloudflareCache([
        `https://snkrs.mcan.sh/sneakers/${sneakerId}`,
        `${prefix}`,
        `${prefix}/${updatedSneaker.brand.name}`,
        `${prefix}/yir/${updatedSneaker.purchaseDate.getFullYear()}`,
      ]);

      session.flash(
        flashMessageKey,
        flashMessage(`Updated ${sneakerId}`, 'success')
      );

      return redirect(pathname);
    } catch (error) {
      session.flash(flashMessageKey, flashMessage(error.message, 'error'));
      if (error instanceof AuthorizationError) {
        session.flash(redirectKey, pathname);
        return redirect(`/login`);
      }

      console.error(error);
      return redirect(pathname);
    }
  });

const meta = ({ data }: { data: RouteData }) => {
  if (!data.sneaker) {
    return {
      title: 'Sneaker Not Found',
    };
  }

  const date = formatDate(data.sneaker.purchaseDate, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const fullName = `${data.sneaker.user.givenName} ${data.sneaker.user.familyName}`;

  const description = `${fullName} bought the ${data.sneaker.brand.name} ${data.sneaker.model} on ${date}`;

  return {
    title: `${data.sneaker.brand.name} ${data.sneaker.model} – ${data.sneaker.colorway}`,
    description,
  };
};

function getEmoji(purchase: number, retail: number) {
  const diff = retail - purchase;

  if (diff >= 10000) return '💎';
  if (diff >= 5000) return '💪';
  if (diff >= 2500) return '🥳';
  if (diff >= 1000) return '😎';
  if (diff >= 500) return '😄';
  if (diff <= 500) return '😕';
  if (diff <= 1000) return '☹️';
  if (diff <= 2500) return '😭';
  return '🤯';
}

const SneakerPage: React.VFC = () => {
  const { sneaker, id, userCreatedSneaker } = useRouteData<RouteData>();

  if (!sneaker) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        <p>No sneaker with id &quot;{id}&quot;</p>
      </div>
    );
  }

  const title = `${sneaker.brand.name} ${sneaker.model} – ${sneaker.colorway}`;
  const purchaseDate = new Date(sneaker.purchaseDate);

  const atRetail = sneaker.retailPrice === sneaker.price;
  const emoji = getEmoji(sneaker.price, sneaker.retailPrice);

  const image1x = getCloudinaryURL(sneaker.imagePublicId, {
    width: '200',
    crop: 'pad',
  });
  const image2x = getCloudinaryURL(sneaker.imagePublicId, {
    width: '400',
    crop: 'pad',
  });
  const image3x = getCloudinaryURL(sneaker.imagePublicId, {
    width: '600',
    crop: 'pad',
  });

  return (
    <div className="container min-h-full p-4 pb-6 mx-auto">
      <Link to="/">Back</Link>
      <div className="grid grid-cols-1 gap-4 pt-4 sm:gap-8 sm:grid-cols-2">
        <div className="relative" style={{ paddingBottom: '100%' }}>
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
        <div>
          <h1 className="text-2xl">{title}</h1>

          {atRetail ? (
            <p className="text-xl">{formatMoney(sneaker.price)}</p>
          ) : (
            <p className="text-xl">
              Bought {sneaker.retailPrice > sneaker.price ? 'below' : 'above'}{' '}
              retail ({formatMoney(sneaker.retailPrice)}) {emoji} for{' '}
              {formatMoney(sneaker.price)}
            </p>
          )}

          <p className="text-md">
            Purchased on{' '}
            <time dateTime={purchaseDate.toISOString()}>
              {formatDate(purchaseDate)}
            </time>
          </p>

          <p>
            Last Updated{' '}
            <time dateTime={new Date(sneaker.updatedAt).toISOString()}>
              {formatDate(sneaker.updatedAt)}
            </time>
          </p>

          {sneaker.sold && sneaker.soldDate && (
            <p className="text-md">
              Sold{' '}
              <time dateTime={sneaker.soldDate}>
                {formatDate(sneaker.soldDate)}{' '}
                {sneaker.soldPrice && <>For {formatMoney(sneaker.soldPrice)}</>}
              </time>
            </p>
          )}

          <Link
            to={`/${sneaker.user.username}/yir/${purchaseDate.getFullYear()}`}
            className="block text-blue-600 transition-colors duration-75 ease-in-out hover:text-blue-900 hover:underline"
          >
            See others purchased in {purchaseDate.getFullYear()}
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
                  const date = formatDate(purchaseDate, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  const fullName = `${sneaker.user.givenName} ${sneaker.user.familyName}`;

                  return navigator.share({
                    title: `${sneaker.brand.name} ${sneaker.model} – ${sneaker.colorway}`,
                    text: `${fullName} bought the ${sneaker.brand.name} ${sneaker.model} on ${date}`,
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
    </div>
  );
};

export default SneakerPage;
export { action, headers, meta, loader };
