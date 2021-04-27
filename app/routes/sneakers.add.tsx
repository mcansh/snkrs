import React from 'react';
import { Form, usePendingFormSubmit } from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { ValidationError } from 'yup';

import { flashMessageKey, redirectKey, sessionKey } from '../constants';
import { prisma } from '../db';
import { AuthorizationError } from '../errors';
import { flashMessage } from '../flash-message';
import { purgeCloudflareCache } from '../lib/cloudflare-cache-purge';
import { cloudinary } from '../lib/cloudinary.server';
import { withSession } from '../lib/with-session';
import { createSneakerSchema } from '../lib/schemas/sneaker';

const meta = () => ({
  title: 'Add a sneaker to your collection',
});

const loader: LoaderFunction = ({ request }) =>
  withSession(request, session => {
    const userId = session.get(sessionKey);
    try {
      if (!userId) {
        throw new AuthorizationError();
      }

      return json(null);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        session.flash(flashMessageKey, flashMessage(error.message, 'error'));
        session.flash(redirectKey, '/sneakers/add');
      } else {
        console.error(error);
      }
      return redirect('/login');
    }
  });

const action: ActionFunction = ({ request }) =>
  withSession(request, async session => {
    try {
      const reqBody = await request.text();
      const formData = new URLSearchParams(reqBody);

      const userId = session.get(sessionKey);

      if (!userId) {
        throw new AuthorizationError();
      }

      const brand = formData.get('brand') as string;
      const model = formData.get('model') as string;
      const colorway = formData.get('colorway') as string;
      const price = parseInt(formData.get('price') as string, 10);
      const retailPrice = parseInt(formData.get('retailPrice') as string, 10);
      const purchaseDate = formData.get('purchaseDate');
      const size = parseInt(formData.get('size') as string, 10);
      const image = formData.get('image');

      const valid = await createSneakerSchema.validate({
        brand,
        model,
        colorway,
        price,
        retailPrice,
        purchaseDate,
        size,
        imagePublicId: image,
      });

      let imagePublicId = '';
      if (valid.imagePublicId) {
        // image was already uploaded to our cloudinary bucket
        if (valid.imagePublicId.startsWith('shoes/')) {
          imagePublicId = valid.imagePublicId;
        } else if (
          /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/gi.test(
            valid.imagePublicId
          )
        ) {
          // image is an url to an external image and we need to send it off to cloudinary to add it to our bucket
          const res = await cloudinary.v2.uploader.upload(valid.imagePublicId, {
            resource_type: 'image',
            folder: 'shoes',
          });

          imagePublicId = res.public_id;
        } else {
          // no image provided
        }
      }

      const sneaker = await prisma.sneaker.create({
        data: {
          User: { connect: { id: userId } },
          brand: valid.brand,
          colorway: valid.colorway,
          model: valid.model,
          price: valid.price,
          purchaseDate: valid.purchaseDate,
          retailPrice: valid.retailPrice,
          size: valid.size,
          imagePublicId,
        },
        include: { User: { select: { username: true } } },
      });

      const prefix = `https://snkrs.mcan.sh/${sneaker.User.username}`;

      await purgeCloudflareCache([
        `${prefix}`,
        `${prefix}/${sneaker.brand}`,
        `${prefix}/yir/${sneaker.purchaseDate.getFullYear()}`,
      ]);

      return redirect(`/sneakers/${sneaker.id}`);
    } catch (error) {
      console.error(error);

      if (error instanceof AuthorizationError) {
        session.flash(flashMessageKey, flashMessage(error.message, 'error'));
        session.flash(redirectKey, `/sneakers/add`);
        return redirect('/login');
      }

      if (error instanceof ValidationError) {
        session.flash(flashMessageKey, flashMessage(error.message, 'error'));
        return redirect('/sneakers/add');
      }

      return redirect('/sneakers/add');
    }
  });

const NewSneakerPage: React.VFC = () => {
  const pendingForm = usePendingFormSubmit();

  return (
    <div className="container min-h-full p-4 pb-6 mx-auto">
      <h2 className="py-4 text-lg">Add a sneaker to your collection</h2>
      <Form method="post">
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
          <label>
            <span className="block text-sm font-medium text-gray-700">
              Price
            </span>
            <input
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              type="number"
              placeholder="34000"
              name="price"
            />
          </label>
          <label>
            <span className="block text-sm font-medium text-gray-700">
              Retail Price
            </span>
            <input
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              type="number"
              placeholder="12000"
              name="retailPrice"
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
            />
          </label>
          <label>
            <span className="block text-sm font-medium text-gray-700">
              Image
            </span>
            <input
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              type="text"
              name="image"
              placeholder="1200x1200 photo or cloudinary publicId"
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
    </div>
  );
};

export default NewSneakerPage;
export { meta, loader, action };
