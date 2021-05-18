import React from 'react';
import { Prisma } from '@prisma/client';
import {
  Form,
  Link,
  usePendingFormSubmit,
  useRouteData,
  redirect,
} from 'remix';
import { format, parseISO } from 'date-fns';
import type { LoaderFunction, ActionFunction } from 'remix';
import { json, parseBody } from 'remix-utils';
import type { Except } from 'type-fest';
import type { MetaFunction } from '@remix-run/react/routeModules';
import slugify from 'slugify';
import clsx from 'clsx';

import { formatDate } from '../utils/format-date';
import { getCloudinaryURL } from '../utils/cloudinary';
import { formatMoney } from '../utils/format-money';
import {
  flashMessageKey,
  redirectAfterAuthKey,
  sessionKey,
} from '../constants';
import { AuthorizationError } from '../errors';
import { prisma } from '../db';
import { withSession } from '../lib/with-session';
import { flashMessage } from '../flash-message';
import { purgeCloudflareCache } from '../lib/cloudflare-cache-purge';
import { sneakerSchema } from '../lib/schemas/sneaker';
import { getCorrectUrl } from '../lib/get-correct-url';

const sneakerWithBrandAndUser = Prisma.validator<Prisma.SneakerArgs>()({
  include: {
    brand: true,
    user: {
      select: {
        familyName: true,
        givenName: true,
        id: true,
      },
    },
  },
});

type SneakerWithBrandAndUser = Except<
  Prisma.SneakerGetPayload<typeof sneakerWithBrandAndUser>,
  'createdAt' | 'purchaseDate' | 'soldDate'
> & {
  createdAt: string;
  purchaseDate: string;
  soldDate?: string;
};

type RouteData =
  | {
      id: string;
      sneaker: SneakerWithBrandAndUser;
      userCreatedSneaker: boolean;
    }
  | {
      id: string;
      sneaker?: never;
      userCreatedSneaker?: never;
    };

const loader: LoaderFunction = ({ params, request }) =>
  withSession(request, async session => {
    const url = new URL(request.url);

    // in development, remix loses the port
    if (process.env.NODE_ENV === 'development') {
      url.port = process.env.PORT ?? '3000';
    }

    try {
      const sneaker = await prisma.sneaker.findUnique({
        where: { id: params.sneakerId },
        include: {
          user: { select: { familyName: true, givenName: true, id: true } },
          brand: true,
        },
      });

      if (!sneaker)
        return json<RouteData>({ id: params.sneakerId }, { status: 404 });

      const userId = session.get(sessionKey);

      const userCreatedSneaker = sneaker?.user.id === userId;

      if (!userId || !userCreatedSneaker) {
        throw new AuthorizationError();
      }

      return json<RouteData>({
        sneaker: {
          ...sneaker,
          createdAt: sneaker.createdAt.toISOString(),
          purchaseDate: sneaker.purchaseDate.toISOString(),
          soldDate: sneaker.soldDate?.toISOString(),
        },
        id: params.sneakerId,
        userCreatedSneaker,
      });
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return redirect(`/login?${redirectAfterAuthKey}=${url.toString()}`);
      } else {
        console.error(error);
      }

      return redirect('/login');
    }
  });

const action: ActionFunction = ({ request, params }) =>
  withSession(request, async session => {
    const userId = session.get(sessionKey);
    const { sneakerId } = params;

    const url = getCorrectUrl(request);

    try {
      const formData = await parseBody(request);

      if (!userId) {
        throw new AuthorizationError();
      }

      const valid = await sneakerSchema.validate(
        {
          brand: formData.get('brand'),
          colorway: formData.get('colorway'),
          imagePublicId: formData.get('image'),
          model: formData.get('model'),
          price: formData.get('price'),
          purchaseDate: formData.get('purchaseDate'),
          retailPrice: formData.get('retailPrice'),
          size: formData.get('size'),
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          sold: formData.get('sold') || false,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          soldDate: formData.get('soldDate') || undefined,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          soldPrice: formData.get('soldPrice') || undefined,
        },
        { abortEarly: false }
      );

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
                slug: slugify(valid.brand, { lower: true }),
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

      return redirect(url.pathname);
    } catch (error) {
      session.flash(flashMessageKey, flashMessage(error.message, 'error'));
      if (error instanceof AuthorizationError) {
        return redirect(`/login?${redirectAfterAuthKey}=${url.toString()}`);
      }

      console.error(error);
      return redirect(url.pathname);
    }
  });

const meta: MetaFunction = ({ data }: { data: RouteData }) => ({
  title: data.sneaker
    ? `Editing ${data.sneaker.brand.name} ${data.sneaker.model} – ${data.sneaker.colorway}`
    : 'Not Found',
});

const formatter = "yyyy-MM-dd'T'HH:mm:ss.SSS";

const EditSneakerPage: React.VFC = () => {
  const { sneaker, id } = useRouteData<RouteData>();
  const pendingForm = usePendingFormSubmit();
  const [sold, setSold] = React.useState(sneaker?.sold ?? false);

  if (!sneaker) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        <p>No sneaker with id &quot;{id}&quot;</p>
      </div>
    );
  }

  const title = `Editing ${sneaker.brand.name} ${sneaker.model} – ${sneaker.colorway}`;

  const sizes = [200, 400, 600];

  const srcSet = sizes.map(
    size =>
      `${getCloudinaryURL(sneaker.imagePublicId, {
        crop: 'pad',
        width: size,
      })} ${size}w`
  );

  return (
    <main className="container h-full p-4 pb-6 mx-auto">
      <Link to={`/sneakers/${sneaker.id}`}>Back</Link>
      <div className="grid grid-cols-1 gap-4 pt-4 sm:gap-8 sm:grid-cols-2">
        <div className="relative" style={{ paddingBottom: '100%' }}>
          <img
            src={srcSet[srcSet.length - 1]}
            srcSet={srcSet.join()}
            alt={title}
            height={1200}
            width={1200}
            className="absolute inset-0 overflow-hidden rounded-md"
            loading="lazy"
          />
        </div>
        <div>
          <h1 className="text-2xl">{title}</h1>
          <p className="text-xl">{formatMoney(sneaker.price)}</p>
          <p>
            <time
              className="text-md"
              dateTime={new Date(sneaker.purchaseDate).toISOString()}
            >
              Purchased {formatDate(sneaker.purchaseDate)}
            </time>
          </p>
        </div>
      </div>
      <div>
        <h2 className="py-4 text-lg">Edit Sneaker:</h2>
        <Form method="post" className="space-y-4">
          <fieldset disabled={!!pendingForm}>
            <div className="grid items-center gap-2 sm:grid-cols-2">
              <input
                className="p-1 border-2 border-gray-200 rounded appearance-none"
                type="text"
                defaultValue={sneaker.brand.name}
                placeholder="Brand"
                name="brand"
              />
              <input
                className="p-1 border-2 border-gray-200 rounded appearance-none"
                type="text"
                defaultValue={sneaker.model}
                placeholder="Model"
                name="model"
              />
              <input
                className="p-1 border-2 border-gray-200 rounded appearance-none"
                type="text"
                defaultValue={sneaker.colorway}
                placeholder="Colorway"
                name="colorway"
              />
              <input
                className="p-1 border-2 border-gray-200 rounded appearance-none"
                type="number"
                defaultValue={sneaker.size}
                placeholder="Size"
                name="size"
              />
              <input
                className="p-1 border-2 border-gray-200 rounded appearance-none"
                type="text"
                defaultValue={sneaker.imagePublicId}
                placeholder="shoes/..."
                name="image"
              />
              <input
                className="p-1 border-2 border-gray-200 rounded appearance-none"
                type="number"
                defaultValue={sneaker.price}
                placeholder="Price"
                name="price"
              />
              <input
                className="p-1 border-2 border-gray-200 rounded appearance-none"
                type="number"
                defaultValue={sneaker.retailPrice}
                placeholder="Retail Price"
                name="retailPrice"
              />
              <input
                className="p-1 border-2 border-gray-200 rounded appearance-none"
                type="datetime-local"
                defaultValue={format(parseISO(sneaker.purchaseDate), formatter)}
                placeholder="Purchase Date"
                name="purchaseDate"
              />
              <div
                className="grid items-center w-full gap-2 sm:grid-cols-2 grid-col"
                style={{
                  gridColumn: '1/3',
                  paddingTop: sold ? undefined : 6,
                }}
              >
                <label className="flex items-center justify-between">
                  <span>Sold?</span>
                  <input
                    type="checkbox"
                    checked={sold}
                    name="sold"
                    onChange={event => setSold(event.currentTarget.checked)}
                  />
                </label>
                <input
                  className={clsx(
                    'p-1 border-2 border-gray-200 rounded appearance-none',
                    sold ? '' : 'hidden'
                  )}
                  type="datetime-local"
                  defaultValue={
                    sneaker.soldDate &&
                    format(parseISO(sneaker.soldDate), formatter)
                  }
                  placeholder="Sold Date"
                  name="soldDate"
                  min={format(parseISO(sneaker.purchaseDate), formatter)}
                />
                <input
                  className={clsx(
                    'p-1 border-2 border-gray-200 rounded appearance-none',
                    sold ? '' : 'hidden'
                  )}
                  type="number"
                  defaultValue={sneaker.soldPrice ?? undefined}
                  placeholder="Sold Price"
                  name="soldPrice"
                />
              </div>
            </div>
            <button
              type="submit"
              className="self-start w-auto px-4 py-2 text-left text-white bg-blue-500 rounded disabled:bg-blue-200 disabled:cursor-not-allowed"
            >
              Sav{pendingForm ? 'ing' : 'e'} Changes
            </button>
          </fieldset>
        </Form>
      </div>
    </main>
  );
};

export default EditSneakerPage;
export { action, loader, meta };
