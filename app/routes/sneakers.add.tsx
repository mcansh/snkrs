import React from 'react';
import {
  Form,
  json,
  unstable_parseMultipartFormData as parseMultipartFormData,
  redirect,
  useTransition,
} from 'remix';
import { ValidationError } from 'yup';
import slugify from 'slugify';
import NumberFormat from 'react-number-format';
import accounting from 'accounting';
import type { ActionFunction, LoaderFunction } from 'remix';
import type { UploadHandler } from '@remix-run/node/formData';

import {
  flashMessageKey,
  redirectAfterAuthKey,
  sessionKey,
} from '../constants';
import { prisma } from '../db.server';
import { AuthorizationError } from '../errors';
import { flashMessage } from '../flash-message';
import { withSession } from '../lib/with-session';
import { sneakerSchema } from '../lib/schemas/sneaker.server';

import { uploadFromStream } from '~/lib/upload-stream-to-cloudinary';

const meta = () => ({
  title: 'Add a sneaker to your collection',
});

const loader: LoaderFunction = ({ request }) =>
  withSession(request, session => {
    const userId = session.get(sessionKey) as string | undefined;

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

const action: ActionFunction = ({ request }) =>
  withSession(request, async session => {
    try {
      const uploadHandler: UploadHandler = async ({ name, stream }) => {
        // we only care about the file form field called "image"
        // so we'll ignore anything else
        // NOTE: the way our form is set up, we shouldn't get any other fields,
        // but this is good defensive programming in case someone tries to hit our
        // action directly via curl or something weird like that.
        if (name !== 'image') {
          stream.resume();
          return;
        }

        const uploadedImage = await uploadFromStream(stream);
        return uploadedImage.public_id;
      };

      const formData = await parseMultipartFormData(request, uploadHandler);

      const userId = session.get(sessionKey) as string | undefined;

      if (!userId) {
        throw new AuthorizationError();
      }

      const brand = formData.get('brand') as string;
      const model = formData.get('model') as string;
      const colorway = formData.get('colorway') as string;
      const rawPrice = formData.get('price') as string;
      const rawRetailPrice = formData.get('retailPrice') as string;
      const purchaseDate = formData.get('purchaseDate');
      const size = parseInt(formData.get('size') as string, 10);
      const imagePublicId = formData.get('image');

      const parsedPrice = Number(rawPrice);
      const price =
        (parsedPrice ? parsedPrice : accounting.unformat(rawPrice)) * 100;

      const parsedRetailPrice = Number(rawRetailPrice);
      const retailPrice =
        (parsedRetailPrice
          ? parsedRetailPrice
          : accounting.unformat(rawRetailPrice)) * 100;

      const valid = await sneakerSchema.validate({
        brand,
        model,
        colorway,
        price,
        retailPrice,
        purchaseDate,
        size,
        imagePublicId,
      });

      const sneaker = await prisma.sneaker.create({
        data: {
          user: { connect: { id: userId } },
          brand: {
            connectOrCreate: {
              where: {
                name: brand,
              },
              create: {
                name: brand,
                slug: slugify(brand, { lower: true }),
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

const NewSneakerPage: React.VFC = () => {
  const transition = useTransition();
  const pendingForm = transition.submission;

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
              className="block w-full text-sm file:font-medium file:cursor-pointer file:px-4 file:py-2 file:text-white file:bg-indigo-600 file:border file:border-transparent file:rounded-md file:shadow-sm file:disabled:bg-blue-200 file:disabled:cursor-not-allowed file:hover:bg-indigo-700 file:focus:outline-none file:focus:ring-2 file:focus:ring-offset-2 file:focus:ring-indigo-500"
              type="file"
              name="image"
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
