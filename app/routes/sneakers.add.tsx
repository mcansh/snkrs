import React from 'react';
import {
  Form,
  json,
  redirect,
  unstable_parseMultipartFormData,
  useTransition,
} from 'remix';
import { ValidationError } from 'yup';
import slugify from 'slugify';
import NumberFormat from 'react-number-format';
import accounting from 'accounting';
import type { ActionFunction, LoaderFunction, MetaFunction } from 'remix';

import { flashMessageKey, redirectAfterAuthKey, sessionKey } from '~/constants';
import { prisma } from '~/db.server';
import { AuthorizationError } from '~/errors';
import { flashMessage } from '~/flash-message';
import { withSession } from '~/lib/with-session';
import { sneakerSchema } from '~/lib/schemas/sneaker.server';
import { getSeoMeta } from '~/seo';
import { createUploadHandler } from '~/lib/upload-image.server';

let meta: MetaFunction = () => {
  return getSeoMeta({
    title: 'Add a sneaker to your collection',
  });
};

let loader: LoaderFunction = ({ request }) =>
  withSession(request, session => {
    let userId = session.get(sessionKey) as string | undefined;

    try {
      if (!userId) {
        throw new AuthorizationError();
      }

      return json(null);
    } catch (error: unknown) {
      if (error instanceof AuthorizationError) {
        session.flash(flashMessageKey, flashMessage(error.message, 'error'));
        return redirect(`/login?${redirectAfterAuthKey}=${request.url}`);
      } else {
        console.error(error);
      }
      return redirect('/login');
    }
  });

let action: ActionFunction = ({ request }) =>
  withSession(request, async session => {
    try {
      let userId = session.get(sessionKey) as string | undefined;

      if (!userId) {
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
      let size =
        typeof rawSize === 'string' ? parseInt(rawSize, 10) : undefined;

      let valid = await sneakerSchema.validate(
        {
          brand,
          model,
          colorway,
          price,
          retailPrice,
          purchaseDate,
          size,
          imagePublicId: image,
        },
        { abortEarly: false }
      );

      let sneaker = await prisma.sneaker.create({
        data: {
          user: { connect: { id: userId } },
          brand: {
            connectOrCreate: {
              where: {
                name: valid.brand,
              },
              create: {
                name: valid.brand,
                slug: slugify(valid.brand, { lower: true }),
              },
            },
          },
          colorway: valid.colorway,
          model: valid.model,
          price: valid.price,
          purchaseDate: valid.purchaseDate.toISOString(),
          retailPrice: valid.retailPrice,
          size: valid.size,
          imagePublicId: valid.imagePublicId,
        },
        include: { user: { select: { username: true } }, brand: true },
      });

      return redirect(`/sneakers/${sneaker.id}`);
    } catch (error: unknown) {
      console.error(error);

      if (error instanceof AuthorizationError) {
        session.flash(flashMessageKey, flashMessage(error.message, 'error'));

        return redirect(`/login?${redirectAfterAuthKey}=${request.url}`);
      }

      if (error instanceof ValidationError) {
        session.flash(flashMessageKey, flashMessage(error.message, 'error'));
        return redirect('/sneakers/add');
      }

      return redirect('/sneakers/add');
    }
  });

let NewSneakerPage: React.VFC = () => {
  let transition = useTransition();
  let pendingForm = transition.submission;

  return (
    <main className="container h-full p-4 pb-6 mx-auto">
      <h2 className="py-4 text-lg">Add a sneaker to your collection</h2>
      <Form method="post" encType="multipart/form-data">
        <fieldset
          disabled={!!pendingForm}
          className="w-full space-y-2 sm:grid sm:items-center sm:gap-x-4 sm:gap-y-6 sm:grid-cols-2 sm:space-y-0"
        >
          <label>
            <span className="block text-sm font-medium text-gray-700">
              Brand
            </span>
            <input
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              type="text"
              placeholder="Nike"
              name="brand"
            />
          </label>
          <label>
            <span className="block text-sm font-medium text-gray-700">
              Model
            </span>
            <input
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              type="text"
              placeholder="Air Max 1"
              name="model"
            />
          </label>
          <label>
            <span className="block text-sm font-medium text-gray-700">
              Colorway
            </span>
            <input
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              type="text"
              placeholder="Anniversary Royal"
              name="colorway"
            />
          </label>
          <label htmlFor="price">
            <span className="block text-sm font-medium text-gray-700">
              Price (in cents)
            </span>
            <NumberFormat
              id="price"
              name="price"
              placeholder="12000"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              prefix="$"
            />
          </label>
          <label htmlFor="retailPrice">
            <span className="block text-sm font-medium text-gray-700">
              Retail Price
            </span>
            <NumberFormat
              id="retailPrice"
              name="retailPrice"
              placeholder="12000"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              prefix="$"
            />
          </label>
          <label>
            <span className="block text-sm font-medium text-gray-700">
              Purchase Date
            </span>
            <input
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              type="datetime-local"
              name="purchaseDate"
            />
          </label>
          <label>
            <span className="block text-sm font-medium text-gray-700">
              Size
            </span>
            <input
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              type="number"
              placeholder="10"
              name="size"
              step={0.5}
            />
          </label>
          <label>
            <span className="block text-sm font-medium text-gray-700">
              Image
            </span>
            <input
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              type="file"
              name="image"
              accept="image/*"
              placeholder="1200x1200 photo"
            />
          </label>
          <button
            type="submit"
            className="self-start w-auto col-span-2 px-4 py-2 text-sm font-medium text-left text-white bg-indigo-600 border border-transparent rounded-md shadow-sm disabled:bg-blue-200 disabled:cursor-not-allowed hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add{!!pendingForm && 'ing'} to collection
          </button>
        </fieldset>
      </Form>
    </main>
  );
};

export default NewSneakerPage;
export { meta, loader, action };
