import React from 'react';
import { Form, usePendingFormSubmit } from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import { flashMessageKey, redirectKey, sessionKey } from '../constants';
import { prisma } from '../db';
import { AuthorizationError } from '../errors';
import { flashMessage } from '../flash-message';
import { commitSession, getSession } from '../session';

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

    return new Response(null, { status: 200 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      session.flash(flashMessageKey, flashMessage(error.message, 'error'));
      session.set(redirectKey, `/sneakers/add`);
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
        imagePublicId: '',
      },
      include: {
        User: {
          select: {
            username: true,
          },
        },
      },
    });

    const purgePromise = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`,
      {
        method: 'DELETE',
        headers: {
          'X-Auth-Email': process.env.CLOUDFLARE_EMAIL,
          'X-Auth-Key': process.env.CLOUDFLARE_PURGE_KEY,
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          files: [`https://snkrs.mcan.sh/${sneaker.User.username}`],
        }),
      }
    );

    const res = await purgePromise.json();

    // eslint-disable-next-line no-console
    console.log('PURGE!', res);

    return redirect(`/sneakers/${sneaker.id}`);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      session.flash(flashMessageKey, flashMessage(error.message, 'error'));
      session.set(redirectKey, `/sneakers/add`);
    }
    return redirect(`/login`, {
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
      <Form method="post" action="/sneakers/add">
        <fieldset
          disabled={!!pendingForm}
          className="grid items-center gap-2 sm:grid-cols-2"
        >
          <input
            className="p-1 border-2 border-gray-200 rounded appearance-none"
            type="text"
            placeholder="Brand"
            name="brand"
          />
          <input
            className="p-1 border-2 border-gray-200 rounded appearance-none"
            type="text"
            placeholder="Model"
            name="model"
          />
          <input
            className="p-1 border-2 border-gray-200 rounded appearance-none"
            type="text"
            placeholder="Colorway"
            name="colorway"
          />
          <input
            className="p-1 border-2 border-gray-200 rounded appearance-none"
            type="number"
            placeholder="Price"
            name="price"
          />
          <input
            className="p-1 border-2 border-gray-200 rounded appearance-none"
            type="number"
            placeholder="Retail Price"
            name="retailPrice"
          />
          <input
            className="p-1 border-2 border-gray-200 rounded appearance-none"
            type="datetime-local"
            placeholder="Purchase Date"
            name="purchaseDate"
          />
          <input
            className="p-1 border-2 border-gray-200 rounded appearance-none"
            type="number"
            placeholder="Size"
            name="size"
          />
          <input
            className="p-1 border-2 border-gray-200 rounded appearance-none"
            type="file"
            name="image"
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
