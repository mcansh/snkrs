import React from 'react';
import { Form, usePendingFormSubmit } from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';

import { flashMessageKey, redirectKey, sessionKey } from '../constants';
import { prisma } from '../db';
import { AuthorizationError } from '../errors';
import { flashMessage } from '../flash-message';
import { commitSession, getSession } from '../session';
import { purgeCloudflareCache } from '../lib/cloudflare-cache-purge';
import { cloudinary } from '../lib/cloudinary.server';

const meta = () => ({
  title: 'Add a sneaker to your collection',
});

const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));
  const userId = session.get(sessionKey);
  try {
    if (!userId) {
      throw new AuthorizationError();
    }

    return json(null);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      session.flash(flashMessageKey, flashMessage(error.message, 'error'));
      session.set(redirectKey, `/sneakers/add`);
    } else {
      console.error(error);
    }
    return redirect(`/login`, {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }
};

const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));

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
    const purchaseDate = new Date();
    const size = parseInt(formData.get('size') as string, 10);
    const image = formData.get('image');

    let imagePublicId = '';
    if (image) {
      // image was already uploaded to our cloudinary bucket
      if (image.startsWith('shoes/')) {
        imagePublicId = image;
      } else if (
        /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/gi.test(
          image
        )
      ) {
        // image is an url to an external image and we need to send it off to cloudinary to add it to our bucket
        const res = await cloudinary.v2.uploader.upload(image, {
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
        brand,
        colorway,
        model,
        price,
        purchaseDate,
        retailPrice,
        size,
        imagePublicId,
      },
      include: {
        User: {
          select: {
            username: true,
          },
        },
      },
    });

    await purgeCloudflareCache([
      `https://snkrs.mcan.sh/${sneaker.User.username}`,
    ]);

    return redirect(`/sneakers/${sneaker.id}`);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      session.flash(flashMessageKey, flashMessage(error.message, 'error'));
      session.set(redirectKey, `/sneakers/add`);
      return redirect(`/login`, {
        headers: {
          'Set-Cookie': await commitSession(session),
        },
      });
    }

    console.error(error);
    return redirect('/sneakers/add', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }
};

const NewSneakerPage: React.VFC = () => {
  const pendingForm = usePendingFormSubmit();

  return (
    <main className="container min-h-full p-4 mx-auto">
      <h2 className="py-4 text-lg">Add a sneaker to your collection</h2>
      <Form method="post">
        <fieldset
          disabled={!!pendingForm}
          className="w-full space-y-2 sm:grid sm:items-center sm:gap-2 sm:grid-cols-2 sm:space-y-0"
        >
          <input
            className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
            type="text"
            placeholder="Brand"
            name="brand"
          />
          <input
            className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
            type="text"
            placeholder="Model"
            name="model"
          />
          <input
            className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
            type="text"
            placeholder="Colorway"
            name="colorway"
          />
          <input
            className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
            type="number"
            placeholder="Price"
            name="price"
          />
          <input
            className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
            type="number"
            placeholder="Retail Price"
            name="retailPrice"
          />
          <input
            className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
            type="datetime-local"
            placeholder="Purchase Date"
            name="purchaseDate"
          />
          <input
            className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
            type="number"
            placeholder="Size"
            name="size"
          />
          <input
            className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
            type="text"
            name="image"
            placeholder="1200x1200 photo or cloudinary publicId"
          />
          <button
            type="submit"
            className="self-start w-auto col-span-2 px-4 py-2 text-left text-white bg-blue-500 rounded disabled:bg-blue-200 disabled:cursor-not-allowed"
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
