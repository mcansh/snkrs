import React from 'react';
import type { Sneaker as SneakerType, User } from '@prisma/client';
import type { HeadersFunction } from '@remix-run/react';
import { Link, useRouteData } from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';

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

type SneakerWithUser = SneakerType & {
  User: Pick<User, 'name' | 'id' | 'username'>;
};

interface Props {
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
      include: { User: { select: { name: true, id: true, username: true } } },
    });

    if (!sneaker) {
      return json({ id: params.sneakerId }, { status: 404 });
    }

    const userCreatedSneaker = sneaker?.User.id === session.get(sessionKey);

    return json(
      {
        sneaker,
        id: params.sneakerId,
        userCreatedSneaker,
      },
      {
        headers: {
          'Cache-Control': userCreatedSneaker
            ? `max-age=60`
            : `max-age=300, s-maxage=31536000, stale-while-revalidate=31536000`,
        },
      }
    );
  });

const action: ActionFunction = ({ request, params }) =>
  withSession(request, async session => {
    const userId = session.get(sessionKey);
    const { sneakerId } = params;

    try {
      const reqBody = await request.text();
      const body = new URLSearchParams(reqBody);

      if (!userId) {
        throw new AuthorizationError();
      }

      // const sneaker = await prisma.sneaker.findUnique({
      //   where: { id },
      // });

      // if (!sneaker) {
      //   return res.status(404).json({ error: 'No sneaker with that id' });
      // }

      // if (sneaker.userId !== userId) {
      //   return res.status(401).json({ error: "you don't own that sneaker" });
      // }

      const bodyObj = Object.fromEntries(body);

      const purchaseDate = bodyObj.purchaseDate
        ? new Date(bodyObj.purchaseDate as string)
        : undefined;

      const soldDate = bodyObj.soldDate
        ? new Date(bodyObj.soldDate as string)
        : undefined;

      const price = bodyObj.price
        ? parseInt(bodyObj.price as string, 10)
        : undefined;

      const retailPrice = bodyObj.retailPrice
        ? parseInt(bodyObj.retailPrice as string, 10)
        : undefined;

      const soldPrice = bodyObj.soldPrice
        ? parseInt(bodyObj.soldPrice as string, 10)
        : undefined;

      const updatedSneaker = await prisma.sneaker.update({
        where: { id: sneakerId },
        data: {
          ...bodyObj,
          soldDate,
          purchaseDate,
          price,
          retailPrice,
          soldPrice,
        },
        select: {
          User: { select: { username: true } },
          brand: true,
          purchaseDate: true,
        },
      });

      const prefix = `https://snkrs.mcan.sh/${updatedSneaker.User.username}`;
      await purgeCloudflareCache([
        `https://snkrs.mcan.sh/sneakers/${sneakerId}`,
        `${prefix}`,
        `${prefix}/${updatedSneaker.brand}`,
        `${prefix}/yir/${updatedSneaker.purchaseDate.getFullYear()}`,
      ]);

      session.flash(
        flashMessageKey,
        flashMessage(`Updated ${sneakerId}`, 'success')
      );

      return redirect(`/sneakers/${sneakerId}`);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        session.set(redirectKey, `/sneakers/${sneakerId}`);
        session.flash(flashMessageKey, flashMessage(error.message, 'error'));
      } else {
        console.error(error);
      }

      return redirect(`/login`);
    }
  });

const meta = ({ data }: { data: Props }) => {
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
  const description = `${data.sneaker.User.name} bought the ${data.sneaker.brand} ${data.sneaker.model} on ${date}`;

  return {
    title: `${data.sneaker.brand} ${data.sneaker.model} – ${data.sneaker.colorway}`,
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

  const image1x = getCloudinaryURL(sneaker.imagePublicId, ['w_400', 'c_pad']);
  const image2x = getCloudinaryURL(sneaker.imagePublicId, ['w_800', 'c_pad']);
  const image3x = getCloudinaryURL(sneaker.imagePublicId, ['w_1200', 'c_pad']);

  return (
    <main className="container min-h-full p-4 mx-auto">
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

          <p>
            Last Updated{' '}
            <time dateTime={new Date(sneaker.updatedAt).toISOString()}>
              {formatDate(sneaker.updatedAt)}
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
export { meta, loader, action, headers };
