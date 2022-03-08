import React from 'react';
import { Prisma } from '@prisma/client';
import {
  Form,
  Link,
  useLoaderData,
  redirect,
  useTransition,
  json,
} from 'remix';
import { format, parseISO } from 'date-fns';
import slugify from 'slugify';
import clsx from 'clsx';
import accounting from 'accounting';
import NumberFormat from 'react-number-format';
import type { MetaFunction, LoaderFunction, ActionFunction } from 'remix';
import type { Except } from 'type-fest';
import invariant from 'tiny-invariant';
import { route } from 'routes-gen';

import { formatDate } from '~/utils/format-date';
import { getCloudinaryURL } from '~/utils/get-cloudinary-url';
import { formatMoney } from '~/utils/format-money';
import { prisma } from '~/db.server';
import type { PossibleErrors } from '~/lib/schemas/sneaker.server';
import { sneakerSchema } from '~/lib/schemas/sneaker.server';
import { cloudinary } from '~/lib/cloudinary.server';
import { requireUserId } from '~/session.server';

let sneakerWithBrandAndUser = Prisma.validator<Prisma.SneakerArgs>()({
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

let loader: LoaderFunction = async ({ params, request }) => {
  invariant(params.sneakerId);
  let userId = await requireUserId(request);

  let sneaker = await prisma.sneaker.findUnique({
    where: { id: params.sneakerId },
    include: {
      user: { select: { familyName: true, givenName: true, id: true } },
      brand: true,
    },
  });

  if (!sneaker) {
    throw new Response(`No sneaker found with id ${params.sneakerId}`, {
      status: 404,
    });
  }

  let userCreatedSneaker = sneaker.user.id === userId;

  if (!userCreatedSneaker) {
    throw new Response("You don't have permission to edit this sneaker", {
      status: 403,
    });
  }

  return json<RouteData>({
    id: params.sneakerId,
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
  });
};

interface ActionData {
  errors: PossibleErrors;
}

let action: ActionFunction = async ({ request, params }) => {
  let userId = await requireUserId(request);
  let { sneakerId } = params;
  invariant(sneakerId);

  let originalSneaker = await prisma.sneaker.findUnique({
    where: { id: sneakerId },
  });

  if (!originalSneaker) {
    throw new Response(`No sneaker found with id ${sneakerId}`, {
      status: 404,
    });
  }

  if (originalSneaker.userId !== userId) {
    throw new Response("You don't have permission to edit this sneaker", {
      status: 403,
    });
  }

  let requestBody = await request.text();
  let formData = new URLSearchParams(requestBody);
  let data = Object.fromEntries(formData);

  let rawPrice = formData.get('price') as string;
  let rawRetailPrice = formData.get('retailPrice') as string;

  let price = Number(rawPrice) || accounting.unformat(rawPrice) * 100;
  let retailPrice =
    Number(rawRetailPrice) || accounting.unformat(rawRetailPrice) * 100;

  let valid = sneakerSchema.safeParse({
    brand: data.brand,
    colorway: data.colorway,
    imagePublicId: data.image,
    model: data.model,
    price,
    purchaseDate: new Date(data.purchaseDate).toISOString(),
    retailPrice,
    size: Number(data.size),
    sold: data.sold,
    soldDate: data.soldDate,
    soldPrice: data.sold && data.soldPrice ? Number(data.soldPrice) : undefined,
  });

  if (!valid.success) {
    return json<ActionData>({
      errors: valid.error.flatten().fieldErrors,
    });
  }

  let imagePublicId = '';
  if (originalSneaker.imagePublicId !== valid.data.imagePublicId) {
    // image was already uploaded to our cloudinary bucket
    if (valid.data.imagePublicId.startsWith('shoes/')) {
      imagePublicId = valid.data.imagePublicId;
    } else if (
      /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/gi.test(
        valid.data.imagePublicId
      )
    ) {
      // image is an url to an external image and we need to send it off to cloudinary to add it to our bucket
      let res = await cloudinary.v2.uploader.upload(valid.data.imagePublicId, {
        resource_type: 'image',
        folder: 'shoes',
      });

      imagePublicId = res.public_id;
    } else {
      // no image provided
    }
  }

  await prisma.sneaker.update({
    where: { id: sneakerId },
    data: {
      brand: {
        connectOrCreate: {
          create: {
            name: valid.data.brand,
            slug: slugify(valid.data.brand, { lower: true }),
          },
          where: { slug: slugify(valid.data.brand, { lower: true }) },
        },
      },
      colorway: valid.data.colorway,
      imagePublicId,
      model: valid.data.model,
      price: valid.data.price,
      purchaseDate: valid.data.purchaseDate,
      retailPrice: valid.data.retailPrice,
      size: valid.data.size,
      sold: valid.data.sold,
      soldDate: valid.data.soldDate ? valid.data.soldDate : null,
      soldPrice: valid.data.soldPrice ? valid.data.soldPrice : null,
    },
    select: {
      user: { select: { username: true } },
      brand: true,
      purchaseDate: true,
    },
  });

  return redirect(request.url);
};

let meta: MetaFunction = ({ data }: { data: RouteData | null }) => ({
  title: data?.sneaker
    ? `Editing ${data.sneaker.brand.name} ${data.sneaker.model} – ${data.sneaker.colorway}`
    : 'Not Found',
});

let formatter = "yyyy-MM-dd'T'HH:mm:ss.SSS";

let EditSneakerPage: React.VFC = () => {
  let { sneaker, id } = useLoaderData<RouteData>();
  let transition = useTransition();
  let pendingForm = transition.submission;
  let [sold, setSold] = React.useState(sneaker?.sold ?? false);

  if (!sneaker) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        <p>No sneaker with id &quot;{id}&quot;</p>
      </div>
    );
  }

  let title = `Editing ${sneaker.brand.name} ${sneaker.model} – ${sneaker.colorway}`;

  let sizes = [200, 400, 600];

  let srcSet = sizes.map(
    size =>
      `${getCloudinaryURL(sneaker.imagePublicId, {
        resize: {
          type: 'pad',
          width: size,
          height: size,
        },
      })} ${size}w`
  );

  return (
    <main className="container h-full p-4 pb-6 mx-auto">
      <Link
        prefetch="intent"
        to={route('/sneakers/:sneakerId', { sneakerId: sneaker.id })}
      >
        Back
      </Link>
      <div className="grid grid-cols-1 gap-4 pt-4 sm:gap-8 sm:grid-cols-2">
        <div className="relative" style={{ paddingBottom: '100%' }}>
          <img
            src={getCloudinaryURL(sneaker.imagePublicId, {
              resize: {
                type: 'pad',
                width: 200,
                height: 200,
              },
            })}
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
              defaultValue={sneaker.price}
            />
            <NumberFormat
              name="retailPrice"
              placeholder="Retail Price (in cents)"
              className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
              prefix="$"
              defaultValue={sneaker.retailPrice}
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
              <input
                className={clsx(
                  'p-1 border-2 border-gray-200 rounded appearance-none',
                  sold ? '' : 'hidden'
                )}
                type="number"
                defaultValue={sneaker.soldPrice ?? ''}
                placeholder="Sold Price"
                name="soldPrice"
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
