import React from 'react';
import { Prisma } from '@prisma/client';
import {
  Form,
  Link,
  useLoaderData,
  redirect,
  useTransition,
  json,
  unstable_parseMultipartFormData,
} from 'remix';
import { format, parseISO } from 'date-fns';
import slugify from 'slugify';
import clsx from 'clsx';
import accounting from 'accounting';
import NumberFormat from 'react-number-format';
import type { MetaFunction, LoaderFunction, ActionFunction } from 'remix';
import type { Except } from 'type-fest';
import { ValidationError } from 'yup';

import { formatDate } from '~/utils/format-date';
import { getImageUrl } from '~/utils/get-image-url';
import { formatMoney } from '~/utils/format-money';
import {
  flashMessageKey,
  imageSizes,
  redirectAfterAuthKey,
  sessionKey,
} from '~/constants';
import { AuthorizationError, NotFoundError } from '~/errors';
import { prisma } from '~/db.server';
import { withSession } from '~/lib/with-session';
import { flashMessage } from '~/flash-message';
import type { SneakerSchema } from '~/lib/schemas/sneaker.server';
import { sneakerSchema } from '~/lib/schemas/sneaker.server';
import { createUploadHandler } from '~/lib/upload-image.server';
import { yupToObject } from '~/lib/yup-to-object';

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
  soldDate: string | undefined;
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
    try {
      const sneaker = await prisma.sneaker.findUnique({
        where: { id: params.sneakerId },
        include: {
          user: { select: { familyName: true, givenName: true, id: true } },
          brand: true,
        },
      });

      if (!sneaker) {
        const data: RouteData = { id: params.sneakerId! };
        return json(data, { status: 404 });
      }

      const userId = session.get(sessionKey) as string | undefined;

      const userCreatedSneaker = sneaker.user.id === userId;

      if (!userId || !userCreatedSneaker) {
        throw new AuthorizationError();
      }

      const data: RouteData = {
        id: params.sneakerId!,
        userCreatedSneaker,
        sneaker: {
          ...sneaker,
          createdAt:
            typeof sneaker.createdAt === 'string'
              ? sneaker.createdAt
              : sneaker.createdAt.toISOString(),
          purchaseDate:
            typeof sneaker.purchaseDate === 'string'
              ? sneaker.purchaseDate
              : sneaker.purchaseDate.toISOString(),
          soldDate:
            typeof sneaker.soldDate === 'string'
              ? sneaker.soldDate
              : sneaker.soldDate?.toISOString(),
        },
      };

      return json(data);
    } catch (error: unknown) {
      if (error instanceof AuthorizationError) {
        return redirect(`/login?${redirectAfterAuthKey}=${request.url}`);
      } else {
        console.error(error);
      }

      return redirect('/login');
    }
  });

const action: ActionFunction = ({ request, params }) =>
  withSession(request, async session => {
    const userId = session.get(sessionKey) as string | undefined;
    const { sneakerId } = params;

    try {
      if (!userId) {
        throw new AuthorizationError();
      }

      const originalSneaker = await prisma.sneaker.findUnique({
        where: { id: sneakerId },
      });

      if (!originalSneaker) {
        throw new NotFoundError();
      }

      if (originalSneaker.userId !== userId) {
        throw new AuthorizationError();
      }

      let uploadHandler = createUploadHandler(['image']);
      let formData = await unstable_parseMultipartFormData(
        request,
        uploadHandler
      );

      let brand = formData.get('brand');
      let model = formData.get('model');
      let colorway = formData.get('colorway');
      let purchaseDate = formData.get('purchaseDate');
      let soldDate = formData.get('soldDate');
      let rawSoldPrice = formData.get('soldPrice');
      let sold = formData.get('sold');
      let rawPrice = formData.get('price');
      let rawRetailPrice = formData.get('retailPrice');
      let rawSize = formData.get('size');
      let image = formData.get('image');

      let price =
        typeof rawPrice === 'string'
          ? Number(rawPrice) || accounting.unformat(rawPrice) * 100
          : undefined;
      let retailPrice =
        typeof rawRetailPrice === 'string'
          ? Number(rawRetailPrice) || accounting.unformat(rawRetailPrice) * 100
          : undefined;
      let soldPrice =
        typeof rawSoldPrice === 'string'
          ? Number(rawSoldPrice) || accounting.unformat(rawSoldPrice) * 100
          : undefined;
      let size =
        typeof rawSize === 'string' ? parseInt(rawSize, 10) : undefined;

      const valid = await sneakerSchema.validate(
        {
          brand,
          colorway,
          imagePublicId: image,
          model,
          price,
          purchaseDate,
          retailPrice,
          size,
          sold: sold === 'on',
          soldDate: soldDate ? soldDate : undefined,
          soldPrice: soldPrice ? soldPrice : undefined,
        },
        { abortEarly: false }
      );

      await prisma.sneaker.update({
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
          retailPrice: valid.retailPrice,
          size: valid.size,
          sold: valid.sold,
          soldDate: valid.sold && valid.soldDate ? valid.soldDate : null,
          soldPrice: valid.sold && valid.soldPrice ? valid.soldPrice : null,
        },
        select: {
          user: { select: { username: true } },
          brand: true,
          purchaseDate: true,
        },
      });

      session.flash(
        flashMessageKey,
        flashMessage(`Updated ${sneakerId}`, 'success')
      );

      return redirect(request.url);
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        const aggregateErrors = yupToObject<SneakerSchema>(error);
        session.flash(flashMessageKey, JSON.stringify(aggregateErrors));
        return redirect(request.url);
      }

      if (error instanceof Error) {
        session.flash(flashMessageKey, flashMessage(error.message, 'error'));
      }
      if (error instanceof AuthorizationError) {
        return redirect(`/login?${redirectAfterAuthKey}=${request.url}`);
      }

      console.error(error);
      return redirect(request.url);
    }
  });

const meta: MetaFunction = ({ data }: { data: RouteData | null }) => ({
  title: data?.sneaker
    ? `Editing ${data.sneaker.brand.name} ${data.sneaker.model} – ${data.sneaker.colorway}`
    : 'Not Found',
});

const formatter = "yyyy-MM-dd'T'HH:mm:ss.SSS";

const EditSneakerPage: React.VFC = () => {
  const { sneaker, id } = useLoaderData<RouteData>();
  const transition = useTransition();
  const pendingForm = transition.submission;
  const [sold, setSold] = React.useState(sneaker?.sold ?? false);

  if (!sneaker) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        <p>No sneaker with id &quot;{id}&quot;</p>
      </div>
    );
  }

  const title = `Editing ${sneaker.brand.name} ${sneaker.model} – ${sneaker.colorway}`;

  const srcSet = imageSizes.map(
    size => `${getImageUrl(sneaker.imagePublicId, size.name)} ${size.w}w`
  );

  return (
    <main className="container h-full p-4 pb-6 mx-auto">
      <Link prefetch="intent" to={`/sneakers/${sneaker.id}`}>
        Back
      </Link>
      <div className="grid grid-cols-1 gap-4 pt-4 sm:gap-8 sm:grid-cols-2">
        <div className="relative" style={{ paddingBottom: '100%' }}>
          <img
            src={getImageUrl(sneaker.imagePublicId, 'desktop')}
            sizes="(min-width: 640px) 50vw, 100vw"
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
        <Form method="post">
          <fieldset
            disabled={!!pendingForm}
            className="pb-4 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-2"
          >
            <input type="hidden" name="image" value={sneaker.imagePublicId} />
            <input
              className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
              type="text"
              defaultValue={sneaker.brand.name}
              placeholder="Brand"
              name="brand"
            />
            <input
              className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
              type="text"
              defaultValue={sneaker.model}
              placeholder="Model"
              name="model"
            />
            <input
              className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
              type="text"
              defaultValue={sneaker.colorway}
              placeholder="Colorway"
              name="colorway"
            />
            <input
              className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
              type="number"
              defaultValue={sneaker.size}
              placeholder="Size"
              name="size"
              step={0.5}
            />
            <input
              className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
              type="text"
              defaultValue={sneaker.imagePublicId}
              placeholder="shoes/..."
              name="image"
            />
            <NumberFormat
              name="price"
              placeholder="Price (in cents)"
              className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
              prefix="$"
              defaultValue={sneaker.price / 100}
            />
            <NumberFormat
              name="retailPrice"
              placeholder="Retail Price (in cents)"
              className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
              prefix="$"
              defaultValue={sneaker.retailPrice / 100}
            />
            <input
              className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
              type="datetime-local"
              defaultValue={format(parseISO(sneaker.purchaseDate), formatter)}
              placeholder="Purchase Date"
              name="purchaseDate"
            />
            <div
              className="grid items-center w-full gap-2 sm:grid-cols-2 grid-col"
              style={{
                gridColumn: '1/3',
                paddingTop: sold ? '' : 6,
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
                  sneaker.soldDate
                    ? format(parseISO(sneaker.soldDate), formatter)
                    : ''
                }
                placeholder="Sold Date"
                name="soldDate"
                min={format(parseISO(sneaker.purchaseDate), formatter)}
              />
              <NumberFormat
                className={clsx(
                  'p-1 border-2 border-gray-200 rounded appearance-none',
                  sold ? '' : 'hidden'
                )}
                defaultValue={sneaker.soldPrice ? sneaker.soldPrice / 100 : ''}
                placeholder="Sold Price (in cents)"
                name="soldPrice"
                prefix="$"
              />
            </div>
            <button
              type="submit"
              className="self-start w-auto px-4 py-2 text-center text-white bg-blue-500 rounded disabled:bg-blue-200 disabled:cursor-not-allowed sm:col-span-2"
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
