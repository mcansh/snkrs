import React from 'react';
import type { Sneaker as SneakerType } from '@prisma/client';
import {
  Form,
  Link,
  usePendingFormSubmit,
  useRouteData,
} from '@remix-run/react';
import { format, parseISO } from 'date-fns';
import type { LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';

import { formatDate } from '../utils/format-date';
import { getCloudinaryURL } from '../utils/cloudinary';
import { formatMoney } from '../utils/format-money';
import { redirectKey, sessionKey } from '../constants';
import { AuthorizationError } from '../errors';
import { prisma } from '../db';
import { withSession } from '../lib/with-session';

interface Props {
  id: string;
  sneaker: SneakerType & {
    soldDate?: string;
    purchaseDate: string;
  };
}

const loader: LoaderFunction = ({ params, request }) =>
  withSession(request, async session => {
    try {
      const sneaker = await prisma.sneaker.findUnique({
        where: { id: params.sneakerId },
        include: {
          User: { select: { familyName: true, givenName: true, id: true } },
        },
      });

      if (!sneaker) return json({ id: params.sneakerId }, { status: 404 });

      const userId = session.get(sessionKey);

      const userCreatedSneaker = sneaker?.User.id === userId;

      if (!userId || !userCreatedSneaker) {
        throw new AuthorizationError();
      }

      return json({
        sneaker,
        id: params.sneakerId,
        userCreatedSneaker,
      });
    } catch (error) {
      if (error instanceof AuthorizationError) {
        session.flash(redirectKey, `/sneakers/${params.sneakerId}/edit`);
      } else {
        console.error(error);
      }

      return redirect('/login');
    }
  });

const formatter = "yyyy-MM-dd'T'HH:mm:ss.SSS";

const EditSneakerPage: React.VFC = () => {
  const { sneaker, id } = useRouteData<Props>();
  const pendingForm = usePendingFormSubmit();

  if (!sneaker) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        <p>No sneaker with id &quot;{id}&quot;</p>
      </div>
    );
  }

  const title = `Editing ${sneaker.brand} ${sneaker.model} – ${sneaker.colorway}`;

  const { imagePublicId } = sneaker;
  const image1x = getCloudinaryURL(imagePublicId, {
    width: '400',
    crop: 'pad',
  });
  const image2x = getCloudinaryURL(imagePublicId, {
    width: '400',
    crop: 'pad',
  });
  const image3x = getCloudinaryURL(imagePublicId, {
    width: '400',
    crop: 'pad',
  });

  return (
    <>
      <Link to={`/sneakers/${sneaker.id}`}>Back</Link>
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
        <Form method="post" className="space-y-4" action={`/sneakers/${id}`}>
          <fieldset disabled={!!pendingForm}>
            <div className="grid items-center gap-2 sm:grid-cols-2">
              <input
                className="p-1 border-2 border-gray-200 rounded appearance-none"
                type="text"
                defaultValue={sneaker.brand}
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
                  paddingTop: !sneaker.sold ? 6 : undefined,
                }}
              >
                <label className="flex items-center justify-between">
                  <span className="">Sold?</span>
                  <input type="checkbox" checked={sneaker.sold} name="sold" />
                </label>
                {sneaker.sold && sneaker.soldDate && (
                  <>
                    <input
                      className="p-1 border-2 border-gray-200 rounded appearance-none"
                      type="datetime-local"
                      defaultValue={format(
                        parseISO(sneaker.soldDate),
                        formatter
                      )}
                      placeholder="Sold Date"
                      name="soldDate"
                      min={format(parseISO(sneaker.purchaseDate), formatter)}
                    />
                    <input
                      className="p-1 border-2 border-gray-200 rounded appearance-none"
                      type="number"
                      defaultValue={sneaker.soldPrice ?? sneaker.price}
                      placeholder="Sold Price"
                      name="soldPrice"
                    />
                  </>
                )}
              </div>
            </div>
            <button
              // disabled={!form.isValid || form.isSubmitting || valuesAreEqual}
              type="submit"
              className="self-start w-auto px-4 py-2 text-left text-white bg-blue-500 rounded disabled:bg-blue-200 disabled:cursor-not-allowed"
            >
              Sav{pendingForm ? 'ing' : 'e'} Changes
            </button>
          </fieldset>
        </Form>
      </div>
    </>
  );
};

export default EditSneakerPage;
export { loader };
