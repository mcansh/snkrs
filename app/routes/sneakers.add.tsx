import React from 'react';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useTransition } from '@remix-run/react';
import slugify from 'slugify';
import NumberFormat from 'react-number-format';
import accounting from 'accounting';
import { route } from 'routes-gen';

import { prisma } from '~/db.server';
import { cloudinary } from '~/lib/cloudinary.server';
import type { PossibleErrors } from '~/lib/schemas/sneaker.server';
import { sneakerSchema } from '~/lib/schemas/sneaker.server';
import { parseStringFormData } from '~/utils/parse-string-formdata';
import { requireUserId } from '~/session.server';
import { getSeoMeta } from '~/seo';

let meta = () => {
  return getSeoMeta({
    title: 'Add a sneaker to your collection',
  });
};

let loader: LoaderFunction = async ({ request }) => {
  await requireUserId(request);
  return json(null);
};

interface ActionData {
  errors: PossibleErrors;
}

let action: ActionFunction = async ({ request }) => {
  let userId = await requireUserId(request);
  let formData = await parseStringFormData(request);

  let price = formData.price
    ? Number(formData.price) || accounting.unformat(formData.price) * 100
    : undefined;
  let retailPrice = formData.retailPrice
    ? Number(formData.retailPrice) ||
      accounting.unformat(formData.retailPrice) * 100
    : undefined;
  let size = formData.size ? parseInt(formData.size, 10) : undefined;

  let valid = sneakerSchema.safeParse({
    brand: formData.brand,
    model: formData.model,
    colorway: formData.colorway,
    price,
    retailPrice,
    purchaseDate: formData.purchaseDate,
    size,
    imagePublicId: formData.image,
  });

  if (!valid.success) {
    return json<ActionData>({
      errors: valid.error.flatten().fieldErrors,
    });
  }

  let imagePublicId = '';
  if (valid.data.imagePublicId) {
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

  let sneaker = await prisma.sneaker.create({
    data: {
      user: { connect: { id: userId } },
      brand: {
        connectOrCreate: {
          where: {
            name: valid.data.brand,
          },
          create: {
            name: valid.data.brand,
            slug: slugify(valid.data.brand, { lower: true }),
          },
        },
      },
      colorway: valid.data.colorway,
      model: valid.data.model,
      price: valid.data.price,
      purchaseDate: valid.data.purchaseDate.toISOString(),
      retailPrice: valid.data.retailPrice,
      size: valid.data.size,
      imagePublicId,
    },
    include: { user: { select: { username: true } }, brand: true },
  });

  return redirect(route('/sneakers/:sneakerId', { sneakerId: sneaker.id }));
};

let NewSneakerPage: React.VFC = () => {
  let transition = useTransition();
  let pendingForm = transition.submission;

  return (
    <main className="container h-full p-4 pb-6 mx-auto">
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
    </main>
  );
};

export default NewSneakerPage;
export { meta, loader, action };
