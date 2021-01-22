import React from 'react';
import type { Sneaker as SneakerType } from '@prisma/client';
import {
  Form,
  Link,
  usePendingFormSubmit,
  useRouteData,
} from '@remix-run/react';
import { format, parseISO } from 'date-fns';
import type { Loader } from '@remix-run/data';
import { redirect } from '@remix-run/data';

import { formatDate } from '../utils/format-date';
import { getCloudinaryURL } from '../utils/cloudinary';
import { formatMoney } from '../utils/format-money';
import { redirectKey, sessionKey } from '../constants';
import type { Context } from '../db';
import { AuthorizationError } from '../errors';

// const schema = Yup.object().shape({
//   model: Yup.string().required(),
//   colorway: Yup.string().required(),
//   brand: Yup.string().required(),
//   size: Yup.number().required().min(1),
//   imagePublicId: Yup.string().required(),
//   price: Yup.number().required(),
//   retailPrice: Yup.number().required(),
//   purchaseDate: Yup.date(),
//   sold: Yup.boolean().required().default(false),
//   soldDate: Yup.date()
//     .when('sold', {
//       is: sold => sold === true,
//       then: Yup.date().required('soldDate is required'),
//     })
//     .min(Yup.ref('sold')),
//   soldPrice: Yup.number().when('sold', {
//     is: sold => sold === true,
//     then: Yup.number().required('soldPrice is required'),
//   }),
// });

interface Props {
  id: string;
  sneaker: SneakerType & {
    soldDate?: string;
    purchaseDate: string;
  };
}

const loader: Loader = async ({ params, session, context }) => {
  const { prisma } = context as Context;

  try {
    const sneaker = await prisma.sneaker.findUnique({
      where: { id: params.sneakerId },
      include: { User: { select: { name: true, id: true } } },
    });

    const userId = session.get(sessionKey);

    const userCreatedSneaker = sneaker?.User.id === userId;

    if (!userId || !userCreatedSneaker) {
      throw new AuthorizationError();
    }

    const body = JSON.stringify({
      sneaker,
      id: params.sneakerId,
      userCreatedSneaker,
    });

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control':
          'max-age=300, s-maxage=600, stale-while-revalidate=31536000',
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      session.set(redirectKey, `/sneakers/${params.sneakerId}/edit`);
    }

    return redirect(`/login`);
  }
};

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
  const image1x = getCloudinaryURL(imagePublicId, { width: 400, crop: 'pad' });
  const image2x = getCloudinaryURL(imagePublicId, { width: 800, crop: 'pad' });
  const image3x = getCloudinaryURL(imagePublicId, { width: 1200, crop: 'pad' });
  /*
    const valuesAreEqual = dequal(form.values, {
      model: sneaker.model,
      colorway: sneaker.colorway,
      brand: sneaker.brand,
      size: sneaker.size,
      imagePublicId: sneaker.imagePublicId,
      price: sneaker.price,
      retailPrice: sneaker.retailPrice,
      purchaseDate: format(sneaker.purchaseDate, formatter),
      sold: sneaker.sold,
      soldDate: sneaker.soldDate
        ? format(sneaker.soldDate, formatter)
        : undefined,
      soldPrice: sneaker.soldPrice,
    });
   */

  return (
    <main className="container min-h-full p-4 mx-auto">
      {/* <NextSeo
        title={title}
        description={description}
        openGraph={{
          title,
          images: [
            { url: image1x, alt: title, width: 400, height: 400 },
            { url: image2x, alt: title, width: 800, height: 800 },
            { url: image3x, alt: title, width: 1200, height: 1200 },
          ],
        }}
      /> */}
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
    </main>
  );
};

export default EditSneakerPage;
export { loader };
